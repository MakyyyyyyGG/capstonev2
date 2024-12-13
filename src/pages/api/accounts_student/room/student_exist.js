import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { account_id, room_code } = req.query;

    try {
      // First get the room_id from rooms table using room_code
      const roomData = await query({
        query: "SELECT room_id FROM rooms WHERE room_code = ?",
        values: [room_code],
      });

      if (roomData.length === 0) {
        return res.status(404).json({ error: "Room not found" });
      }

      const room_id = roomData[0].room_id;

      // Then check if student exists in student_room table using account_id and room_id
      const studentExists = await query({
        query:
          "SELECT * FROM student_room WHERE student_id = ? AND room_id = ?",
        values: [account_id, room_id],
      });

      res.status(200).json({ exists: studentExists.length > 0 });
    } catch (error) {
      console.error("Error checking student existence:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
