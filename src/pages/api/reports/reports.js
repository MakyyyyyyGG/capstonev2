import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    //get students list in room
    const { room_code, account_id } = req.query;
    console.log("Room Code", room_code, "Account ID", account_id);
    try {
      const studentData = await query({
        query: `SELECT 
    user_game_plays.score, 
    user_game_plays.created_at, 
    games.game_type, 
    games.title,
    user_game_plays.account_id, 
    user_game_plays.game_id,
    rooms.room_name,
    rooms.room_difficulty AS room_difficulty,
    CASE 
      WHEN games.game_type = 'Color Game' THEN (
          SELECT COUNT(*) 
          FROM color_game 
          WHERE color_game_set_id = (
              SELECT color_game_set_id 
              FROM color_game_sets 
              WHERE game_id = user_game_plays.game_id
          )
      )
      WHEN games.game_type = 'Decision Maker' THEN (
          SELECT COUNT(*) 
          FROM decision_maker 
          WHERE decision_maker_set_id = (
              SELECT decision_maker_set_id 
              FROM decision_maker_sets 
              WHERE game_id = user_game_plays.game_id
          )
      )
      WHEN games.game_type = 'ThinkPic' THEN (
          SELECT COUNT(*) 
          FROM four_pics_one_word 
          WHERE four_pics_one_word_set_id = (
              SELECT four_pics_one_word_set_id 
              FROM four_pics_one_word_sets 
              WHERE game_id = user_game_plays.game_id
          )
      )
      WHEN games.game_type = 'ThinkPic +' THEN (
          SELECT COUNT(*) 
          FROM four_pics_advanced 
          WHERE four_pics_advanced_set_id = (
              SELECT four_pics_advanced_set_id 
              FROM four_pics_advanced_sets 
              WHERE game_id = user_game_plays.game_id
          )
      )
      WHEN games.game_type = 'Sequence Game' THEN (
          SELECT COUNT(*) 
          FROM sequence_game 
          WHERE sequence_game_set_id = (
              SELECT sequence_game_sets_id 
              FROM sequence_game_sets 
              WHERE game_id = user_game_plays.game_id
          )
      )
      ELSE NULL
    END AS set_length
FROM 
    user_game_plays
INNER JOIN 
    games ON user_game_plays.game_id = games.game_id
INNER JOIN 
    rooms ON games.room_code = rooms.room_code
WHERE 
    rooms.account_id = ?
ORDER BY 
    user_game_plays.created_at ASC;
; 
`,
        values: [account_id],
      });
      res.status(200).json({ studentData });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
