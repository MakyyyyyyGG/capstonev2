import { query } from "@/lib/db";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const getAllAccounts = await query({
        query: `SELECT account_id, first_name, last_name, email, user_role, password 
FROM teachers
UNION
SELECT account_id, first_name, last_name, email, user_role, password
FROM students;`,
      });
      res.status(200).json(getAllAccounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const { first_name, last_name, email, password, user_role } = req.body;

      console.log(req.body);

      // Check if email already exists
      const checkEmail = await query({
        query: `SELECT * FROM ${
          user_role === "teacher" ? "teachers" : "students"
        } WHERE email = ?`,
        values: [email],
      });

      if (checkEmail.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Encrypt password using SHA256
      const encryptedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      const result = await query({
        query: `INSERT INTO ${
          user_role === "teacher" ? "teachers" : "students"
        } 
               (first_name, last_name, email, password, user_role) 
               VALUES (?, ?, ?, ?, ?)`,
        values: [first_name, last_name, email, encryptedPassword, user_role],
      });

      res
        .status(201)
        .json({ message: "User created successfully", id: result.insertId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const {
        first_name,
        last_name,
        email,
        password,
        user_role,
        original_role,
      } = req.body;
      const id = req.query.id;
      console.log(req.body, id);

      // Check if email already exists in the new role table
      let checkEmail = [];
      if (user_role !== original_role) {
        checkEmail = await query({
          query: `SELECT * FROM ${
            user_role === "teacher" ? "teachers" : "students"
          } WHERE email = ?`,
          values: [email],
        });
      }

      if (checkEmail.length > 0) {
        return res
          .status(400)
          .json({ error: "Username already exists in the new role" });
      }

      let updateQuery = `UPDATE ${
        original_role === "teacher" ? "teachers" : "students"
      } 
                        SET first_name = ?, last_name = ?, email = ?`;
      let values = [first_name, last_name, email];

      let encryptedPassword;
      if (password && password !== null) {
        // Encrypt password using SHA256
        encryptedPassword = crypto
          .createHash("sha256")
          .update(password)
          .digest("hex");
        updateQuery += `, password = ?`;
        values.push(encryptedPassword);
      }

      updateQuery += ` WHERE account_id = ?`;
      values.push(id);

      // If user_role is not equal to user_original role, delete the record in the original role and insert in the user role
      if (user_role !== original_role) {
        await query({
          query: `DELETE FROM ${
            original_role === "teacher" ? "teachers" : "students"
          } WHERE account_id = ?`,
          values: [id],
        });

        // Get existing password if no new password provided
        let passwordToUse = encryptedPassword;
        if (!password || password === null) {
          const existingUser = await query({
            query: `SELECT password FROM ${
              original_role === "teacher" ? "teachers" : "students"
            } WHERE account_id = ?`,
            values: [id],
          });
          passwordToUse = existingUser[0].password;
        }

        updateQuery = `INSERT INTO ${
          user_role === "teacher" ? "teachers" : "students"
        } (first_name, last_name, email, password, user_role) VALUES ( ?, ?, ?, ?, ?)`;
        values = [first_name, last_name, email, passwordToUse, user_role];
      }

      await query({
        query: updateQuery,
        values: values,
      });

      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const id = req.query.id;

      // First try deleting from teachers
      let result = await query({
        query: "DELETE FROM teachers WHERE account_id = ?",
        values: [id],
      });

      // If no rows affected, try students table
      if (result.affectedRows === 0) {
        result = await query({
          query: "DELETE FROM students WHERE account_id = ?",
          values: [id],
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
