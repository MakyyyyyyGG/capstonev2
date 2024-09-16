import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { room_code } = req.query;
      const games = await query({
        query: `SELECT * FROM games WHERE room_code = ?`,
        values: [room_code],
      });
      res.status(200).json(games);
      console.log("data", games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
