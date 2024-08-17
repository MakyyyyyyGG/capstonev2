import { query } from "@/lib/db";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password} = req.body;
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Fetch user from the database
    const userResult = await query({
      query: "SELECT * FROM users WHERE email = ?",
      values: [email],
    });

    if (userResult.length === 0) {
      // If no user found
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = userResult[0];

    // Check if the hashed password matches
    if (user.password !== hashedPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // If the user is authenticated, return the user data
    res.status(200).json({ id: user.id, email: user.email });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
