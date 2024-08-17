// pages/api/check-room-code.js

import { query } from "@/lib/db";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const result = await query({
      query: "SELECT COUNT(*) AS count FROM rooms WHERE room_code = ?",
      values: [code],
    });

    const exists = result[0].count > 0;
    res.status(200).json({ exists });
  } catch (error) {
    res.status(500).json({ error: "Database query failed" });
  }
}
