import { Client } from 'pg';

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { email, password } = JSON.parse(event.body);
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    // Check if user already exists
    const check = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (check.rows.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, message: "User already exists!" })
      };
    }

    // Insert new user
    await client.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, password]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Registration successful!" })
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error!" }) };
  } finally {
    await client.end();
  }
}
