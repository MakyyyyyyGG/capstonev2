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
    const { room_code, account_id, cards, title, difficulty } = req.body;

    try {
      const gameType = "Color Game";
      const gameResult = await query({
        query:
          "INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)",
        values: [title, room_code, account_id, gameType, difficulty],
      });
      const gameId = gameResult.insertId;

      const groupResult = await query({
        query:
          "INSERT INTO color_game_sets (title, room_code, account_id, game_id) VALUES (?, ?, ?, ?)",
        values: [title, room_code, account_id, gameId],
      });
      const groupId = groupResult.insertId;

      const cardPromises = cards.map((card) => {
        const imageFileNames = card.images.map((image) => image || null);
        while (imageFileNames.length < 4) {
          imageFileNames.push(null);
        }
        return query({
          query:
            "INSERT INTO color_game (color_game_set_id, color, image1, image2, image3, image4) VALUES (?, ?, ?, ?, ?, ?)",
          values: [groupId, card.color, ...imageFileNames],
        });
      });

      await Promise.all(cardPromises);
      res.status(200).json({ groupId, gameId });
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ error: "Error creating game" });
    }
  } else if (req.method === "GET") {
    const { game_id, account_id } = req.query;
    try {
      // Check if account_id is provided before checking ownership
      if (account_id) {
        const ownerResults = await query({
          query:
            "SELECT * FROM color_game_sets JOIN teachers ON color_game_sets.account_id = teachers.account_id WHERE color_game_sets.account_id = ?",
          values: [account_id],
        });

        if (!ownerResults.length) {
          return res.status(403).json({ error: "Unauthorized access" });
        }
      }

      const gameResults = await query({
        query:
          "SELECT * FROM color_game_sets JOIN games ON color_game_sets.game_id = games.game_id WHERE color_game_sets.game_id = ?",
        values: [game_id],
      });

      if (!gameResults.length) {
        return res.status(404).json({ error: "Game not found" });
      }

      const groupId = gameResults[0].color_game_set_id;

      const cardsResults = await query({
        query: `
          SELECT color_game.*, games.title, games.difficulty, games.game_id
          FROM color_game 
          JOIN color_game_sets ON color_game.color_game_set_id = color_game_sets.color_game_set_id 
          JOIN games ON color_game_sets.game_id = games.game_id
          WHERE color_game.color_game_set_id = ?
        `,
        values: [groupId],
      });

      if (!cardsResults.length) {
        return res.status(404).json({ error: "Cards not found" });
      }

      res.status(200).json(cardsResults);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ error: "Error fetching game" });
    }
  } else if (req.method === "PUT") {
    const { color_game_id } = req.query;
    const { cards, title, game_id, difficulty } = req.body;
    console.log("cards", cards);

    try {
      // Get the current card data
      const currentCardResults = await query({
        query: "SELECT * FROM color_game WHERE color_game_id = ?",
        values: [color_game_id],
      });

      if (!currentCardResults.length) {
        return res.status(404).json({ error: "Card not found" });
      }

      const currentCard = currentCardResults[0];
      let imageFileNames = [];

      // Loop through images and update only if the new image is different
      for (let i = 1; i <= 4; i++) {
        const imageKey = `images${i}`;
        if (cards.images[i - 1]) {
          imageFileNames.push(cards.images[i - 1] || currentCard[imageKey]); // Use new image if provided, otherwise retain old image
        } else {
          imageFileNames.push(null); // Set to null if there is no filename
        }
      }
      console.log("imageFileNames", imageFileNames);
      // Update the images and color in the color_game table
      const updateCardResult = await query({
        query:
          "UPDATE color_game SET image1 = ?, image2 = ?, image3 = ?, image4 = ?, color = ? WHERE color_game_id = ?",
        values: [...imageFileNames, cards.color, color_game_id],
      });

      if (updateCardResult.affectedRows > 0) {
        // Also update the title in the color_game_sets table
        const updateTitleResult = await query({
          query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
          values: [title, difficulty, game_id],
        });

        if (updateTitleResult.affectedRows > 0) {
          return res
            .status(200)
            .json({ message: "Card and title updated successfully" });
        } else {
          return res.status(404).json({ error: "Failed to update the title" });
        }
      } else {
        return res.status(404).json({ error: "Card not found" });
      }
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ error: "Error updating game" });
    }
  } else if (req.method === "DELETE") {
    const { game_id } = req.query;
    try {
      const deleteGameResult = await query({
        query: "DELETE FROM games WHERE game_id = ?",
        values: [game_id],
      });
      if (deleteGameResult.affectedRows > 0) {
        res.status(200).json({ message: "Game deleted successfully" });
      } else {
        res.status(404).json({ error: "Game not found" });
      }
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ error: "Error deleting game" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
