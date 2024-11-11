import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { sticker_id, coin_cost, account_id } = req.body;
    console.log(req.body);
    try {
      const result = await query({
        query:
          "INSERT INTO owned_sticker (sticker_id, account_id) VALUES (?, ?)",
        values: [sticker_id, account_id],
      });

      //get the user's coins
      const coins = await query({
        query: "SELECT coins FROM students WHERE account_id = ?",
        values: [account_id],
      });
      const userCoins = coins[0].coins;
      console.log(userCoins);
      console.log(coin_cost);

      const newCoins = userCoins - coin_cost;

      //update the user's coins
      await query({
        query: "UPDATE students SET coins = ? WHERE account_id = ?",
        values: [newCoins, account_id],
      });

      res.status(200).json({ result, newCoins });
    } catch (error) {
      console.error("Error claiming or buying sticker:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
