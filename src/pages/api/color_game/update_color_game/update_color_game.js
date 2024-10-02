import { query } from "@/lib/db";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    let { cards } = req.body;
    console.log("POST NEW CARDSs cards", cards);

    // Ensure cards is an array
    if (!Array.isArray(cards)) {
      cards = [cards];
    }

    try {
      for (const card of cards) {
        const { color_game_set_id, color, images } = card;
        const imageFileNames = [];
        for (let i = 0; i < 3; i++) {
          imageFileNames.push(images[i] || null); // Use new image if provided, otherwise use null
        }

        const result = await query({
          query:
            "INSERT INTO color_game (color_game_set_id, image1, image2, image3, color) VALUES (?, ?, ?, ?, ?)",
          values: [color_game_set_id, ...imageFileNames, color],
        });

        if (result.affectedRows > 0) {
          console.log(`Card created successfully: ${result.insertId}`);
        } else {
          throw new Error("Failed to create card");
        }
      }
      res.status(200).json({ message: "Cards created successfully" });
    } catch (error) {
      console.error("Error updating color_game:", error);
      res.status(500).json({ error: "Error updating color_game" });
    }
  } else if (req.method === "DELETE") {
    const { color_game_id } = req.query;
    console.log("color_game_id", color_game_id);
    try {
      const result = await query({
        query: "DELETE FROM color_game WHERE color_game_id = ?",
        values: [color_game_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Card deleted successfully: ${color_game_id}`);
        res.status(200).json({ message: "Card deleted successfully" });
      } else {
        throw new Error("Failed to delete card");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Error deleting card" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
