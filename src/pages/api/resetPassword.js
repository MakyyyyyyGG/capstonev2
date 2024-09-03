import { query } from "@/lib/db";
import crypto from "crypto";
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { email } = req.query;
    try {
      const userResult = await query({
        query: `SELECT email FROM teachers WHERE email = ? UNION ALL SELECT email FROM students WHERE email = ?`,
        values: [email, email],
      });

      // Check if any user was found
      if (userResult.length === 0) {
        return res
          .status(404)
          .json({ userFound: false, error: "User not found" });
      }

      res.status(200).json({ userFound: true, users: userResult });
    } catch (error) {
      console.error("Error querying users:", error);
      res.status(500).json({ error: "Failed to query users" });
    }
  } else if (req.method === "PUT") {
    const { email } = req.query;
    const { newPassword } = req.body;

    const hashedPassword = crypto
      .createHash("sha256")
      .update(newPassword)
      .digest("hex");

    try {
      // Update in 'teachers' table
      const teacherUpdateResult = await query({
        query: "UPDATE teachers SET password = ? WHERE email = ?",
        values: [hashedPassword, email],
      });

      // Update in 'students' table
      const studentUpdateResult = await query({
        query: "UPDATE students SET password = ? WHERE email = ?",
        values: [hashedPassword, email],
      });

      // Check if any rows were updated
      if (
        teacherUpdateResult.affectedRows === 0 &&
        studentUpdateResult.affectedRows === 0
      ) {
        return res
          .status(404)
          .json({ success: false, message: "User not found in any table" });
      }

      res
        .status(200)
        .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
