import { query } from "../../lib/db";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password, firstName, lastName, user_role } = req.body;
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    try {
      // Check if the user already exists
      const existingUser = await query({
        query: `
          SELECT account_id
          FROM students
          WHERE email = ?
          UNION
          SELECT account_id
          FROM teachers
          WHERE email = ?
        `,
        values: [email, email],
      });

      if (existingUser.length > 0) {
        return res.status(409).json({ error: "User already exists" });
      }

      // If user doesn't exist, insert new account
      const newAccount = await query({
        query:
          "INSERT INTO students (email, password, first_name, last_name, user_role) VALUES (?, ?, ?, ?, ?)",
        values: [email, hashedPassword, firstName, lastName, user_role],
      });

      res.status(200).json({ newAccount });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  } else if (req.method === "GET") {
    const users = await query({
      query: "SELECT * FROM students",
    });
    res.status(200).json({ users: users });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
