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
      query: `SELECT 
        student_room.student_room_id,
        rooms.room_name,
        rooms.room_difficulty,
        rooms.room_code,
        student_room.student_id,
        teachers.email,
        teachers.profile_image
      FROM student_room
      JOIN rooms ON student_room.room_id = rooms.room_id
      JOIN teachers ON rooms.account_id = teachers.account_id
      JOIN students ON student_room.student_id = students.account_id	
      WHERE students.account_id = ? ORDER BY rooms.created_at DESC`,
      values: [student_id],
    });

    // Fetch assignments that the student hasn't submitted yet in the room
    const assignments = await query({
      query: `
        SELECT a.title, a.room_code, a.assignment_id, a.due_date, r.room_name
        FROM capstone.assignment AS a
        LEFT JOIN capstone.submitted_assignment AS sa 
          ON a.assignment_id = sa.assignment_id 
          AND sa.account_id = ? 
        JOIN rooms AS r ON a.room_code = r.room_code
        WHERE r.room_id IN (SELECT room_id FROM student_room WHERE student_id = ?)
          AND sa.submitted_assignment_id IS NULL
        ORDER BY a.due_date DESC;`,
      values: [student_id, student_id],
    });

    res.status(200).json({ roomData, assignments });
  } else if (req.method === "DELETE") {
    const { student_room_id } = req.query;
    console.log("Student_room_id: ", student_room_id);
    const roomData = await query({
      query: `DELETE FROM student_room WHERE student_room_id = ?`,
      values: [student_room_id],
    });
    res.status(200).json({ roomData });
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
