import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { room_code } = req.query;
    try {
      const gameRecords = await query({
        query: `	SELECT user_game_plays.score, user_game_plays.created_at, games.game_type, user_game_plays.account_id 
        FROM user_game_plays
        INNER JOIN games ON user_game_plays.game_id = games.game_id
        WHERE games.room_code = ?  ORDER BY user_game_plays.created_at DESC`,
        values: [room_code],
      });
      res.status(200).json({ gameRecords });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
