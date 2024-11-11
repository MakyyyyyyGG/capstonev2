import { query } from "@/lib/db";

//fetch stickers
export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const stickers = await query({
        query: "SELECT * FROM stickers",
      });
      res.status(200).json(stickers);
    } catch (error) {
      console.error("Error fetching stickers:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
