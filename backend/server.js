import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";

// ======== ENV & PATH SETUP ========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current backend folder
dotenv.config({ path: path.join(__dirname, ".env") });
console.log("ENV FILE LOADED: MONGO_URI =", process.env.MONGO_URI);

const app = express();

// ======== CORS CONFIG ========
app.use(
  cors({
    origin: [
      "http://127.0.0.1:8080",
      "http://localhost:8080",
      "http://127.0.0.1:5500",
    ],
    credentials: true,
  })
);

// ======== MIDDLEWARE ========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      httpOnly: true,
    },
  })
);

// ======== AUTH MIDDLEWARE ========
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) next();
  else res.status(403).json({ loggedIn: false, message: "Access denied. Please log in." });
};

// ======== DATABASE CONNECTION ========
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

// ======== SCHEMAS ========

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// Story Schema
const storySchema = new mongoose.Schema({
  name: { type: String, default: "Anonymous" },
  story: { type: String, default: "" },
  voiceUrl: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});
const Story = mongoose.model("Story", storySchema);

// ======== CART SESSION SETUP ========
app.use((req, res, next) => {
  if (!req.session.cart) req.session.cart = [];
  next();
});

// ======== FILE UPLOAD CONFIG ========
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ======== ROUTES ========

// Test route
app.get("/", (req, res) => {
  res.send("🌿 GreenNest backend connected successfully!");
});

// ======== AUTH ROUTES ========

// Check session
app.get("/check-session", (req, res) => {
  if (req.session && req.session.user)
    return res.json({ loggedIn: true, user: req.session.user });
  res.status(401).json({ loggedIn: false });
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });

    res.json({ success: true, message: "Registered successfully!" });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid password" });

    req.session.user = { id: user._id, email: user.email, name: user.name };
    res.json({ success: true, message: "Login successful!", user: req.session.user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ success: false, message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// ======== PROFILE ROUTES ========

// Get profile
app.get("/get-profile", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  if (!user) return res.json({ success: false, message: "User not found" });
  res.json({ success: true, profile: user });
});

// Update profile
app.post("/update-profile", isLoggedIn, upload.single("profilePic"), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const profilePicPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateFields = { name, email, phone, address };
    if (profilePicPath) updateFields.profilePic = profilePicPath;

    const user = await User.findByIdAndUpdate(req.session.user.id, updateFields, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// ======== STORY ROUTES ========

// Submit story (with optional voice upload)
app.post("/share-story", upload.single("voice"), async (req, res) => {
  try {
    const { name, story } = req.body;

    if (!name && !story && !req.file)
      return res.status(400).json({ success: false, message: "Need a name, story, or voice message." });

    const voiceUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const newStory = new Story({
      name: name || "Anonymous",
      story: story || "",
      voiceUrl,
    });

    await newStory.save();
    res.json({ success: true, message: "Story shared successfully!" });
  } catch (err) {
    console.error("SHARE STORY ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to share story: " + err.message });
  }
});

// Get all stories
app.get("/get-stories", async (req, res) => {
  try {
    const stories = await Story.find().sort({ date: -1 });
    res.json({ success: true, stories });
  } catch (err) {
    console.error("GET STORIES ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stories: " + err.message });
  }
});

// ======== CART ROUTES ========

// Add to cart
app.post("/add-to-cart", isLoggedIn, (req, res) => {
  const { name, price, image } = req.body;
  req.session.cart.push({ name, price, image });
  res.json({ success: true, cart: req.session.cart });
});

// Get cart
app.get("/get-cart", isLoggedIn, (req, res) => {
  res.json({ success: true, cart: req.session.cart });
});

// Remove from cart
app.post("/remove-from-cart", isLoggedIn, (req, res) => {
  const { index } = req.body;
  req.session.cart.splice(index, 1);
  res.json({ success: true, cart: req.session.cart });
});

// Checkout
app.post("/checkout", isLoggedIn, (req, res) => {
  req.session.cart = [];
  res.json({ success: true, message: "Order placed successfully" });
});

// ======== START SERVER ========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));