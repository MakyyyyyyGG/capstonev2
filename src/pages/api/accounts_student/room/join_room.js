import { query, closePool } from "@/lib/db";

export default async function handler(req, res) {
  const { roomCode, studentId } = req.body;

  if (req.method === "POST") {
    if (!roomCode || !studentId) {
      return res.status(400).json({ error: "Missing room code or student ID" });
    }

    try {
      const roomData = await query({
        query: "SELECT * FROM rooms WHERE room_code = ?",
        values: [roomCode],
      });

      if (roomData.length === 0) {
        return res.status(404).json({ error: "Room not found" });
      }

      const room = roomData[0].room_id;

      // Check if the student is already in the room
      const checkStudent = await query({
        query:
          "SELECT * FROM student_room WHERE room_id = ? AND student_id = ?",
        values: [room, studentId],
      });

      if (checkStudent.length > 0) {
        console.log("Student already in the room");
        return res.status(400).json({ error: "Student already in the room" });
      }

      // Add student to the room
      const insertStudent = await query({
        query: "INSERT INTO student_room (room_id, student_id) VALUES (?, ?)",
        values: [room, studentId],
      });

      return res.status(200).json({ insertStudent });
    } catch (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    const { student_id } = req.query;
    const roomData = await query({
      query: `select 
	rooms.room_name,
	rooms.room_difficulty,
    rooms.room_code,
    student_room.student_id
from student_room
join
	rooms on student_room.room_id = rooms.room_id
join
	students on student_room.student_id = students.account_id	
where students.account_id = ?`,
      values: [student_id],
    });
    res.status(200).json({ roomData });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
