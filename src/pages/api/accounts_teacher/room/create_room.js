import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { account_id } = req.query;
    const roomsData = await query({
      query: `SELECT rooms.*, teachers.profile_image
FROM rooms
JOIN teachers ON rooms.account_id = teachers.account_id
WHERE rooms.account_id = ?
ORDER BY rooms.created_at DESC;
`,
      values: [account_id],
    });
    res.status(200).json({ roomsData });
  }

  if (req.method === "POST") {
    const { account_id, room_name, difficulty, room_code } = req.body;

    // Check if the room code already exists
    const existingRoom = await query({
      query: "SELECT * FROM rooms WHERE room_code = ?",
      values: [room_code],
    });

    if (existingRoom.length > 0) {
      return res.status(400).json({ error: "Room code already exists" });
    }

    // If the room code does not exist, insert the new room
    const roomsData = await query({
      query:
        "INSERT INTO rooms (account_id, room_name, room_difficulty, room_code, created_at) VALUES (?, ?, ?, ?, NOW())",
      values: [account_id, room_name, difficulty, room_code],
    });
    res.status(200).json({ roomsData });
  }
  if (req.method === "DELETE") {
    const { room_code } = req.body;
    const roomsData = await query({
      query: "DELETE FROM rooms WHERE room_code = ?",
      values: [room_code],
    });
    res.status(200).json({ roomsData });
  }
  if (req.method === "PUT") {
    const { room_code } = req.query;
    const { room_name, room_difficulty } = req.body;
    const roomsData = await query({
      query:
        "UPDATE rooms SET room_name = ?, room_difficulty = ?, created_at = NOW() WHERE room_code = ? ",
      values: [room_name, room_difficulty, room_code],
    });
    res.status(200).json({ roomsData });
  }
}
