import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

const saveFileToPublic = async (base64String, fileName, folder) => {
  const dataUriRegex = /^data:(image\/(?:png|jpg|jpeg|gif));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 image data");

  const base64Data = base64String.replace(dataUriRegex, "");
  const filePath = path.join(process.cwd(), "public", folder, fileName);

  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, base64Data, "base64", (err) => {
      if (err) {
        console.error(`Failed to save file: ${filePath}`, err);
        reject(err);
      } else {
        console.log(`Saved file: ${filePath}`);
        resolve(`/${folder}/${fileName}`);
      }
    });
  });
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Increase the size limit to 10MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { room_code, account_id, cards, title, difficulty } = req.body;

    try {
      const gameType = "4 Pics 1 Word Advanced";
      const gameResult = await query({
        query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
        values: [title, room_code, account_id, gameType, difficulty],
      });
      const gameId = gameResult.insertId;

      try {
        const groupResult = await query({
          query: `INSERT INTO four_pics_advanced_sets (title, room_code, account_id, game_id) VALUES (?, ?, ?, ?)`,
          values: [title, room_code, account_id, gameId],
        });
        const groupId = groupResult.insertId;

        const cardPromises = cards.map(async (card) => {
          const imageFileNames = await Promise.all(
            card.images.map(async (image) => {
              if (image) {
                const imageFileName = `${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}.png`;
                const fullPath = await saveFileToPublic(
                  image,
                  imageFileName,
                  "four_pics_advanced/images"
                );
                return fullPath;
              }
              return null;
            })
          );
          const correctAnswers = card.correct_answers.join(",");
          return query({
            query: `INSERT INTO four_pics_advanced (four_pics_advanced_set_id, image1, image2, image3, image4, word, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            values: [groupId, ...imageFileNames, card.word, correctAnswers],
          });
        });
        await Promise.all(cardPromises);
        res
          .status(200)
          .json({ message: "Game and group created successfully" });
      } catch (groupError) {
        console.error(
          "Error inserting into four_pics_advanced_sets:",
          groupError
        );
        res
          .status(500)
          .json({ error: "Error inserting into four_pics_advanced_sets" });
      }
    } catch (gameError) {
      console.error("Error creating game:", gameError);
      res.status(500).json({ error: "Error creating game" });
    }
  } else if (req.method === "GET") {
    const { game_id } = req.query;

    //get4pic1word set
    try {
      const gameResults = await query({
        query: `SELECT * FROM four_pics_advanced_sets JOIN games ON four_pics_advanced_sets.game_id = games.game_id WHERE four_pics_advanced_sets.game_id = ?`,
        values: [game_id],
      });

      if (!gameResults.length) {
        res.status(404).json({ error: "Game not found" });
        return;
      }

      const groupId = gameResults[0].four_pics_advanced_set_id;
      console.log("groupId", groupId);

      try {
        const cardsResults = await query({
          query: `SELECT four_pics_advanced.*, four_pics_advanced_sets.title, games.title, games.difficulty, games.game_id
FROM four_pics_advanced 
JOIN four_pics_advanced_sets
ON four_pics_advanced.four_pics_advanced_set_id = four_pics_advanced_sets.four_pics_advanced_set_id 
JOIN games 
ON four_pics_advanced_sets.game_id = games.game_id
WHERE four_pics_advanced.four_pics_advanced_set_id = ?`,
          values: [groupId],
        });

        if (!cardsResults.length) {
          res.status(404).json({ error: "Cards not found" });
          return;
        }

        res.status(200).json(cardsResults);
      } catch (cardsError) {
        console.error("Error fetching cards:", cardsError);
        res.status(500).json({ error: "Error fetching cards" });
      }
    } catch (gameError) {
      console.error("Error fetching game:", gameError);
      res.status(500).json({ error: "Error fetching game" });
    }
  } else if (req.method === "DELETE") {
    const { game_id } = req.query;
    try {
      const deleteResults = await query({
        query: `DELETE FROM games WHERE game_id = ?`,
        values: [game_id],
      });
      if (deleteResults.affectedRows > 0) {
        res.status(200).json({ message: "Game deleted successfully" });
      } else {
        res.status(404).json({ error: "Game not found" });
      }
    } catch (deleteError) {
      console.error("Error deleting game:", deleteError);
      res.status(500).json({ error: "Error deleting game" });
    }
  } else if (req.method === "PUT") {
    const { four_pics_advanced_id } = req.query;
    const { cards, title, difficulty, game_id } = req.body;

    try {
      // Get the current card data
      const currentCardResults = await query({
        query:
          "SELECT * FROM four_pics_advanced WHERE four_pics_advanced_id = ?",
        values: [four_pics_advanced_id],
      });

      if (!currentCardResults.length) {
        return res.status(404).json({ error: "Card not found" });
      }

      const currentCard = currentCardResults[0];
      let imageFileNames = [];

      // Loop through images and update only if the new image is different
      for (let i = 1; i <= 4; i++) {
        const imageKey = `image${i}`;
        const newImage = cards.images[i - 1]; // Adjust indexing for images array

        if (newImage && newImage.startsWith("data:image")) {
          const imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;
          const savedImagePath = await saveFileToPublic(
            newImage,
            imageFileName,
            "four_pics_advanced/images"
          );
          imageFileNames.push(savedImagePath);
          console.log(`New image saved: ${savedImagePath}`);
        } else {
          imageFileNames.push(currentCard[imageKey]); // Retain old image if not changed
        }
      }

      // Update the images and word in the four_pics_one_word table
      const correctAnswers = cards.correct_answers.join(",");
      const updateCardResult = await query({
        query:
          "UPDATE four_pics_advanced SET image1 = ?, image2 = ?, image3 = ?, image4 = ?, word = ?, correct_answer = ? WHERE four_pics_advanced_id = ?",
        values: [
          ...imageFileNames,
          cards.word,
          correctAnswers,
          four_pics_advanced_id,
        ],
      });
      const getGameId = await query({
        query:
          "select * from four_pics_one_word_sets join games on four_pics_one_word_sets.game_id = games.game_id where four_pics_one_word_sets.game_id = ?",
        values: [game_id],
      });
      if (updateCardResult.affectedRows > 0) {
        // Also update the title in the four_pics_one_word_sets table
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
      console.error("Error updating card:", error);
      res.status(500).json({ error: "Error updating card" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
