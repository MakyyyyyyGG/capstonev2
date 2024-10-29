import { query } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

const saveFileToPublic = async (base64String, fileName, folder) => {
  const dataUriRegex = /^data:(image\/(?:png|jpg|jpeg|gif));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 image data");

  const base64Data = base64String.replace(dataUriRegex, "");
  const filePath = path.join(process.cwd(), "public", folder, fileName);

  try {
    await fs.writeFile(filePath, base64Data, "base64");
    console.log(`Saved file: ${filePath}`);
    return `/${folder}/${fileName}`;
  } catch (err) {
    console.error(`Failed to save file: ${filePath}`, err);
    throw err;
  }
};

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
      const gameType = "ThinkPic +";
      const gameResult = await query({
        query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
        values: [title, room_code, account_id, gameType, difficulty],
      });
      const gameId = gameResult.insertId;

      const groupResult = await query({
        query: `INSERT INTO four_pics_advanced_sets (title, room_code, account_id, game_id) VALUES (?, ?, ?, ?)`,
        values: [title, room_code, account_id, gameId],
      });
      const groupId = groupResult.insertId;

      const cardPromises = cards.map(async (card) => {
        const imageFileNames = await Promise.all(
          card.images.map(async (image) => {
            if (image) {
              if (image.startsWith("http")) {
                return image;
              } else {
                const imageFileName = `${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}.png`;
                return await saveFileToPublic(
                  image,
                  imageFileName,
                  "four_pics_advanced/images"
                );
              }
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
        .json({ message: "Game and group created successfully", gameId });
    } catch (error) {
      console.error("Error creating game or group:", error);
      res.status(500).json({ error: "Error creating game or group" });
    }
  } else if (req.method === "GET") {
    const { game_id } = req.query;

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

      const cardsResults = await query({
        query: `SELECT four_pics_advanced.*, four_pics_advanced_sets.title, games.title, games.difficulty, games.game_id
                FROM four_pics_advanced 
                JOIN four_pics_advanced_sets ON four_pics_advanced.four_pics_advanced_set_id = four_pics_advanced_sets.four_pics_advanced_set_id 
                JOIN games ON four_pics_advanced_sets.game_id = games.game_id
                WHERE four_pics_advanced.four_pics_advanced_set_id = ?`,
        values: [groupId],
      });

      if (!cardsResults.length) {
        res.status(404).json({ error: "Cards not found" });
        return;
      }

      res.status(200).json(cardsResults);
    } catch (error) {
      console.error("Error fetching game or cards:", error);
      res.status(500).json({ error: "Error fetching game or cards" });
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
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ error: "Error deleting game" });
    }
  } else if (req.method === "PUT") {
    const { four_pics_advanced_id } = req.query;
    const { cards, title, difficulty, game_id } = req.body;

    try {
      const currentCardResults = await query({
        query:
          "SELECT * FROM four_pics_advanced WHERE four_pics_advanced_id = ?",
        values: [four_pics_advanced_id],
      });

      if (!currentCardResults.length) {
        return res.status(404).json({ error: "Card not found" });
      }

      const currentCard = currentCardResults[0];
      const imageFileNames = await Promise.all(
        cards.images.map(async (newImage, i) => {
          const imageKey = `image${i + 1}`;
          if (
            newImage &&
            (newImage.startsWith("data:image") || newImage.startsWith("http"))
          ) {
            if (newImage.startsWith("data:image")) {
              const imageFileName = `${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}.png`;
              return await saveFileToPublic(
                newImage,
                imageFileName,
                "four_pics_advanced/images"
              );
            } else {
              return newImage;
            }
          } else {
            return currentCard[imageKey];
          }
        })
      );

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

      if (updateCardResult.affectedRows > 0) {
        const updateTitleResult = await query({
          query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
          values: [title, difficulty, game_id],
        });

        if (updateTitleResult.affectedRows > 0) {
          res
            .status(200)
            .json({ message: "Card and title updated successfully" });
        } else {
          res.status(404).json({ error: "Failed to update the title" });
        }
      } else {
        res.status(404).json({ error: "Card not found" });
      }
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ error: "Error updating card" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
