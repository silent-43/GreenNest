import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import path from "path";
import multer from "multer";
import fs from "fs";

dotenv.config({ path: path.resolve("S:/Nursery Website/backend/.env") });
console.log("ENV FILE LOADED: MONGO_URI =", process.env.MONGO_URI);

const app = express();

// ------------------ CORS ------------------
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

// ------------------ MIDDLEWARE ------------------
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

// ------------------ DATABASE ------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

// ------------------ SCHEMA ------------------
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

// ------------------ CART SESSION ------------------
app.use((req, res, next) => {
  if (!req.session.cart) req.session.cart = [];
  next();
});

// ------------------ FILE UPLOAD SETUP ------------------
const uploadDir = path.resolve("S:/Nursery Website/backend/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ------------------ ROUTES ------------------

// Test route
app.get("/", (req, res) => {
  res.send("🌿 GreenNest backend connected successfully!");
});

// Check session
app.get("/check-session", (req, res) => {
  if (req.session && req.session.user)
    return res.json({ loggedIn: true, user: req.session.user });
  res.json({ loggedIn: false });
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
    const newUser = await User.create({ name, email, password: hashedPassword });
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
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

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
    if (err) return res.status(500).json({ success: false, message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// ------------------ PROFILE ROUTES ------------------

// Get profile
app.get("/get-profile", async (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: "Not logged in" });
  const user = await User.findById(req.session.user.id);
  if (!user) return res.json({ success: false, message: "User not found" });
  res.json({ success: true, profile: user });
});

// Update profile (with image upload)
app.post("/update-profile", upload.single("profilePic"), async (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: "Not logged in" });

  try {
    const { name, email, phone, address } = req.body;
    let profilePicPath = req.file
      ? `/uploads/${req.file.filename}`
      : undefined;

    const updateFields = { name, email, phone, address };
    if (profilePicPath) updateFields.profilePic = profilePicPath;

    const user = await User.findByIdAndUpdate(req.session.user.id, updateFields, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve uploaded images
app.use("/uploads", express.static(uploadDir));

// ------------------ CART ROUTES ------------------
app.post("/add-to-cart", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ success: false, message: "Not logged in" });
  const { name, price, image } = req.body;
  req.session.cart.push({ name, price, image });
  res.json({ success: true, cart: req.session.cart });
});

app.get("/get-cart", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ success: false, message: "Not logged in" });
  res.json({ success: true, cart: req.session.cart });
});

app.post("/remove-from-cart", (req, res) => {
  const { index } = req.body;
  if (!req.session.user)
    return res.status(401).json({ success: false, message: "Not logged in" });
  req.session.cart.splice(index, 1);
  res.json({ success: true, cart: req.session.cart });
});

app.post("/checkout", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ success: false, message: "Not logged in" });
  req.session.cart = [];
  res.json({ success: true, message: "Order placed successfully" });
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
