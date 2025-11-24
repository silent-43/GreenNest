import express from "express";
import { client } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const result = await client.query(
      "SELECT * FROM users WHERE email=$1 AND password=$2",
      [email, password]
    );

    if(result.rows.length === 0){
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const user = result.rows[0];

    if(role && user.role !== role){
      return res.json({
        success: false,
        message: "You are not authorized for this login type"
      });
    }

    return res.json({
      success: true,
      role: user.role,
      message: "Login successful"
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.json({ success: false, message: "Server error" });
  }
});

export default router;
