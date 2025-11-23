import express from "express";
import { client } from "../db.js";

const router = express.Router();

router.post("/reset-password", async (req, res) => {
  const { email, otp, newpass } = req.body;

  const user = await client.query(
    "SELECT * FROM users WHERE email=$1 AND otp=$2",
    [email, otp]
  );

  if (user.rows.length === 0) {
    return res.json({ message: "Invalid OTP!" });
  }

  await client.query(
    "UPDATE users SET password=$1, otp=NULL WHERE email=$2",
    [newpass, email]
  );

  res.json({ message: "Password Reset Successful!" });
});

export default router;
