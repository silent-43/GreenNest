import { Client } from 'pg';

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { email, password } = JSON.parse(event.body);
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const res = await client.query("SELECT * FROM users WHERE email = $1 AND password = $2", [email, password]);

    if (res.rows.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, message: "Invalid email or password!" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error!" }) };
  } finally {
    await client.end();
  }
}







async function sendOTP() {
  const email = document.getElementById("email").value;

  const res = await fetch("http://localhost:5000/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  document.getElementById("msg").innerText = data.message;
}

async function resetPassword() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;
  const newpass = document.getElementById("newpass").value;

  const res = await fetch("http://localhost:5000/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newpass })
  });

  const data = await res.json();
  document.getElementById("msg").innerText = data.message;
}
