import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { account_id } = req.query;

    try {
      const studentsData = await query({
        query: `SELECT 
    s.account_id, 
    s.first_name, 
    s.last_name, 
    r.room_name,
    r.room_difficulty,
    r.created_at AS room_created_at
FROM 
    students s
    INNER JOIN student_room sr ON s.account_id = sr.student_id
    INNER JOIN rooms r ON sr.room_id = r.room_id
WHERE 
    r.account_id = ?
ORDER BY 
    r.room_name ASC`,
        values: [account_id],
      });

      return res.status(200).json({ studentsData });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
