import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    //get students list in room
    const { room_code } = req.query;
    try {
      const studentData = await query({
        query: `select students.account_id, students.first_name, students.last_name, students.profile_image from student_room 
                    inner join rooms on rooms.room_id = student_room.room_id
                    inner join students on student_room.student_id = students.account_id
                    where rooms.room_code = ?`,
        values: [room_code],
      });
      res.status(200).json({ studentData });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
