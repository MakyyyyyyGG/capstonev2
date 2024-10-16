import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { room_code } = req.query;
    const studentsData = await query({
      query: `SELECT 
        students.account_id,
        students.profile_image,
        students.first_name,
        students.last_name,
        rooms.room_id
      FROM 
        student_room
      JOIN 
        students ON student_room.student_id = students.account_id
      JOIN 
        rooms ON student_room.room_id = rooms.room_id
      JOIN 
        teachers ON rooms.account_id = teachers.account_id
      WHERE rooms.room_code = ?`,
      values: [room_code],
    });
    res.status(200).json({ studentsData });
  } else if (req.method === "DELETE") {
    const { account_id, room_code } = req.body;
    console.log(account_id, room_code);
    try {
      const roomResult = await query({
        query: `SELECT room_id FROM rooms WHERE room_code = ?`,
        values: [room_code],
      });

      if (roomResult.length === 0) {
        return res.status(404).json({ message: "Room not found" });
      }

      const roomId = roomResult[0].room_id;

      const removeStudent = await query({
        query: `DELETE FROM student_room WHERE student_id = ? AND room_id = ?`,
        values: [account_id, roomId],
      });

      res.status(200).json({ message: "Student removed successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
