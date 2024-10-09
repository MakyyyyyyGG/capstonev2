import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { account_id, game_id, score } = req.body;

    try {
      // Check how many games the user has played in the last hour
      const countResult = await query({
        query: `
          SELECT COUNT(*) as count 
          FROM user_game_plays 
          WHERE account_id = ? AND game_id = ? AND created_at > NOW() - INTERVAL 1 HOUR
        `,
        values: [account_id, game_id],
      });

      const gamesPlayedInLastHour = countResult[0].count;

      if (gamesPlayedInLastHour >= 3) {
        return res
          .status(403)
          .json({ message: "You can only play 3 times per hour." });
      }

      // If under the limit, proceed to insert the new record
      await query({
        query: `
          INSERT INTO user_game_plays (account_id, game_id, score, created_at) 
          VALUES (?, ?, ?, NOW())
        `,
        values: [account_id, game_id, score],
      });

      return res.status(200).json({ message: "Record inserted successfully" });
    } catch (error) {
      console.error("Error inserting record:", error);
      return res.status(500).json({ message: "Failed to insert record" });
    }
  }

  if (req.method === "GET") {
    try {
      const account_id = req.query.account_id;
      const result = await query({
        query: "SELECT * FROM user_game_plays WHERE account_id = ?",
        values: [account_id],
      });
      return res
        .status(200)
        .json({ message: "Student record fetched successfully", data: result });
    } catch (error) {
      console.error("Error fetching record:", error);
      return res.status(500).json({ message: "Failed to fetch record" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
