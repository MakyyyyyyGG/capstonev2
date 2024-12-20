import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { account_id, coins, exp } = req.body;
    console.log("req.body", req.body);
    try {
      const result = await query({
        query: `SELECT coins, exp FROM students WHERE account_id = ?`,
        values: [account_id],
      });

      console.log("initial coins and exp", result[0].coins, result[0].exp);

      const newCoins = result[0].coins + coins;
      const newExp = result[0].exp + exp;

      await query({
        query: `UPDATE students SET coins = ?, exp = ? WHERE account_id = ?`,
        values: [newCoins, newExp, account_id],
      });

      console.log("Updated coins:", newCoins);
      console.log("Updated exp:", newExp);

      return res.status(200).json({
        message: "Coins and exp updated",
        coins: newCoins,
        exp: newExp,
      });
    } catch (error) {
      console.error("Error fetching coins and exp:", error);
      return res.status(500).json({ message: "Failed to fetch coins and exp" });
    }
  } else if (req.method === "PUT") {
    const { account_id } = req.query;
    const { price } = req.body;
    console.log("req.body", req.body);
    console.log("im reached");
    try {
      const result = await query({
        query: `SELECT coins, exp FROM students WHERE account_id = ?`,
        values: [account_id],
      });

      console.log("initial coins and exp", result[0].coins, result[0].exp);

      if (result[0].coins < price) {
        return res.status(400).json({ message: "Not enough coins" });
      }

      const newCoins = result[0].coins - price;

      console.log("Coins left", newCoins);

      await query({
        query: `UPDATE students SET coins = ? WHERE account_id = ?`,
        values: [newCoins, account_id],
      });

      console.log("Updated coins:", newCoins);

      return res.status(200).json({
        message: "Coins updated",
        coins: newCoins,
      });
    } catch (error) {
      console.error("Error fetching coins and exp:", error);
      return res.status(500).json({ message: "Failed to fetch coins and exp" });
    }
  }
}
