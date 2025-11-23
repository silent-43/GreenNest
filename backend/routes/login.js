import express from "express";
import { client } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await client.query(
    "SELECT * FROM users WHERE email=$1 AND password=$2",
    [email, password]
  );

  if (result.rows.length === 0) {
    return res.json({ success: false, message: "Invalid email or password" });
  }

  res.json({ success: true });
});

export default router;
