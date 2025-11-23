import express from "express";
import multer from "multer";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "greennest",
  password: "your_db_password",
  port: 5432,
});

// Multer setup (file upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 🟢 POST /submit-story
app.post("/submit-story", upload.single("media"), async (req, res) => {
  try {
    const { name, email, story } = req.body;
    const mediaPath = req.file ? req.file.filename : null;

    // user insert (if not exists)
    const userResult = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id",
      [name, email]
    );
    const userId = userResult.rows[0].id;

    // story insert
    await pool.query(
      "INSERT INTO stories (user_id, story, media_path) VALUES ($1, $2, $3)",
      [userId, story, mediaPath]
    );

    res.json({ message: "Story submitted successfully!" });
  } catch (err) {
    console.error("Error submitting story:", err);
    res.status(500).json({ message: "Failed to submit. Please try again later." });
  }
});
