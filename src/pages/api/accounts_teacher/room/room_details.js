import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { room_code } = req.query;
    const roomsData = await query({
      query: `
        SELECT 
          rooms.room_name,
          rooms.room_difficulty,
          rooms.room_code,
          rooms.room_id,
          teachers.account_id,
          teachers.email,
          teachers.first_name,
          teachers.last_name
        FROM 
          rooms
        JOIN 
          teachers ON rooms.account_id = teachers.account_id
        LEFT JOIN 
          student_room ON rooms.room_id = student_room.room_id
        WHERE 
          rooms.room_code = ?
      `,
      values: [room_code],
    });
    res.status(200).json({ roomsData });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
