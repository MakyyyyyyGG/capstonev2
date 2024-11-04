import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    console.log("im reached");
    const account_id = req.query.account_id;
    try {
      const result = await query({
        query: `SELECT user_game_plays.score, user_game_plays.created_at, games.title, games.game_type, user_game_plays.account_id, user_game_plays.game_id,
                CASE 
                  WHEN games.game_type = 'Color Game' THEN (SELECT COUNT(*) FROM color_game WHERE color_game_set_id = (SELECT color_game_set_id FROM color_game_sets WHERE game_id = user_game_plays.game_id))
                  WHEN games.game_type = 'Decision Maker' THEN (SELECT COUNT(*) FROM decision_maker WHERE decision_maker_set_id = (SELECT decision_maker_set_id FROM decision_maker_sets WHERE game_id = user_game_plays.game_id))
                  WHEN games.game_type = 'ThinkPic' THEN (SELECT COUNT(*) FROM four_pics_one_word WHERE four_pics_one_word_set_id = (SELECT four_pics_one_word_set_id FROM four_pics_one_word_sets WHERE game_id = user_game_plays.game_id))
                  WHEN games.game_type = 'ThinkPic +' THEN (SELECT COUNT(*) FROM four_pics_advanced WHERE four_pics_advanced_set_id = (SELECT four_pics_advanced_set_id FROM four_pics_advanced_sets WHERE game_id = user_game_plays.game_id))
                  WHEN games.game_type = 'Sequence Game' THEN (SELECT COUNT(*) FROM sequence_game WHERE sequence_game_set_id = (SELECT sequence_game_sets_id FROM sequence_game_sets WHERE game_id = user_game_plays.game_id))
                  ELSE NULL
                END AS set_length
                FROM user_game_plays
                INNER JOIN games ON user_game_plays.game_id = games.game_id
                WHERE user_game_plays.account_id = ? 
                ORDER BY user_game_plays.created_at DESC`,
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
