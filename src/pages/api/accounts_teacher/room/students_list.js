import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { room_code } = req.query;
    const studentsData = await query({
      query: `select 
students.account_id,
	students.first_name,
    students.last_name,
    rooms.room_id
from 
	student_room
join 
	students on student_room.student_id = students.account_id
join 
	rooms on student_room.room_id = rooms.room_id
join 
	teachers on rooms.account_id = teachers.account_id
where rooms.room_code = ?`,
      values: [room_code],
    });
    res.status(200).json({ studentsData });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
