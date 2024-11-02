import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { account_id } = req.query;
    try {
      const numGames = await query({
        query: "SELECT COUNT(*) as total FROM games WHERE account_id = ?",
        values: [account_id],
      });
      res.status(200).json({ numGames: numGames[0].total });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
