import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    console.log("im reached");
    const account_id = req.query.account_id;
    try {
      const result = await query({
        query: `SELECT user_game_plays.score, user_game_plays.created_at, games.game_type, user_game_plays.account_id 
        FROM user_game_plays
        INNER JOIN games ON user_game_plays.game_id = games.game_id
        WHERE user_game_plays.account_id = ? ORDER BY user_game_plays.created_at DESC`,
        values: [account_id],
      });
      return res.status(200).json({
        message: "Student game records fetched successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching student record:", error);
      return res.status(500).json({
        message: "Error fetching student record",
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }
}
