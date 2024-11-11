import { query } from "@/lib/db";

//fetch user owned stickers

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { account_id } = req.query;

    try {
      const stickers = await query({
        query: "SELECT * FROM owned_sticker WHERE account_id = ?",
        values: [account_id],
      });

      res.status(200).json(stickers);
    } catch (error) {
      console.error("Error fetching stickers:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
