import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const saveFileToPublic = async (base64String, fileName, folder) => {
  console.log("im reached");
  const dataUriRegex =
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav));base64,/;
  const match = base64String.toString().match(dataUriRegex);

  if (!match) {
    throw new Error("Invalid base64 string format");
  }

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

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { room_code, account_id, cards, title, difficulty } = req.body;
    const extractedColors = cards.map((card) => card.color);
    // console.log(extractedColors);
    // console.log(req.body);
    // console.log(cards);
    try {
      const gameType = "Color Game Advanced";
      const gameResult = await query({
        query:
          "INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)",
        values: [title, room_code, account_id, gameType, difficulty],
      });
      const gameId = gameResult.insertId;
      try {
        const groupResult = await query({
          query: `INSERT INTO color_game_advanced_sets (title, room_code, account_id, game_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
          values: [title, room_code, account_id, gameId],
        });
        const groupId = groupResult.insertId;
        const cardPromises = cards.map(async (card) => {
          if (card.insertedAudio) {
            const audioFileName = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}.wav`;
            card.insertedAudio = await saveFileToPublic(
              card.insertedAudio,
              audioFileName,
              "color_game_advanced/audio"
            );
            console.log(`Audio URI: ${card.insertedAudio}`);
          }
          const imageFileNames = card.images.filter((image) => image !== null);
          const colorArray = card.colors.filter((color) => color !== null);

          //   console.log(
          //     "all data:",
          //     groupId,
          //     card.insertedAudio,
          //     ...colorArray,
          //     ...imageFileNames
          //   );
          return query({
            query: `INSERT INTO color_game_advanced (color_game_advanced_set_id, color ,images, audio) VALUES (?, ?, ?, ?)`,
            values: [
              groupId,
              colorArray.join(","),
              imageFileNames.join(","),
              card.insertedAudio,
            ],
          });
        });
        await Promise.all(cardPromises);
        res
          .status(200)
          .json({ message: "Game and group created successfully" });
      } catch (error) {
        console.error("Error inserting into color game advanced form:", error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  } else if (req.method === "GET") {
    console.log("GET request received");
    const { game_id } = req.query;
    console.log(game_id);
    try {
      const gameResults = await query({
        query:
          "SELECT * FROM color_game_advanced_sets JOIN games ON color_game_advanced_sets.game_id = games.game_id WHERE color_game_advanced_sets.game_id = ?",
        values: [game_id],
      });
      if (!gameResults.length) {
        return res.status(404).json({ error: "Game not found" });
      }
      // console.log(gameResults);

      const groupId = gameResults[0].color_game_advanced_sets_id;
      // console.log("group id:", groupId);

      const cardsResults = await query({
        query: `
          SELECT color_game_advanced.*, games.title, games.difficulty, games.game_id
          FROM color_game_advanced 
          JOIN color_game_advanced_sets ON color_game_advanced.color_game_advanced_set_id = color_game_advanced_sets.color_game_advanced_sets_id 
          JOIN games ON color_game_advanced_sets.game_id = games.game_id
          WHERE color_game_advanced.color_game_advanced_set_id = ?;
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
    const { color_game_advanced_id } = req.query;
    const { cards, title, game_id, difficulty } = req.body;
    console.log("body", req.body);
    try {
      const currentCardResults = await query({
        query:
          "SELECT * FROM color_game_advanced WHERE color_game_advanced_id = ?",
        values: [color_game_advanced_id],
      });

      if (!currentCardResults.length) {
        return res.status(404).json({ error: "Card not found" });
      }

      const currentCard = currentCardResults[0];
      let imageFileNames = [];
      let colorArray = [];
      for (let i = 1; i <= 10; i++) {
        const imageKey = `images${i}`;
        if (cards.images[i - 1]) {
          imageFileNames.push(cards.images[i - 1] || currentCard[imageKey]); // Use new image if provided, otherwise retain old image
        } else {
          break; // Stop adding if the next index is null
        }
      }
      for (let i = 1; i <= 10; i++) {
        const colorKey = `colors${i}`;
        if (cards.colors[i - 1]) {
          colorArray.push(cards.colors[i - 1] || currentCard[colorKey]); // Use new color if provided, otherwise retain old color
        } else {
          break; // Stop adding if the next index is null
        }
      }
      if (cards.insertedAudio) {
        const audioFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.wav`;
        cards.insertedAudio = await saveFileToPublic(
          cards.insertedAudio,
          audioFileName,
          "color_game_advanced/audio"
        );
        console.log(`Audio URI: ${cards.insertedAudio}`);
      }

      await query({
        query:
          "UPDATE color_game_advanced SET images = ?, color = ?, audio = ? WHERE color_game_advanced_id = ?",
        values: [
          imageFileNames.join(","),
          colorArray.join(","),
          cards.insertedAudio || cards.audio,
          color_game_advanced_id,
        ],
      });

      // Also update the title in the games table
      const updateTitleResult = await query({
        query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
        values: [title, difficulty, game_id],
      });

      if (updateTitleResult.affectedRows > 0) {
        return res
          .status(200)
          .json({ message: "Cards and title updated successfully" });
      } else {
        return res.status(404).json({ error: "Failed to update the title" });
      }
    } catch (error) {
      console.error("Error updating cards:", error);
      res.status(500).json({ error: "Error updating cards" });
    }
  } else if (req.method === "DELETE") {
    const { game_id } = req.query;
    console.log("game_id", game_id);
    try {
      const result = await query({
        query: "DELETE FROM games WHERE game_id = ?",
        values: [game_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Card deleted successfully: ${game_id}`);
        res.status(200).json({ message: "Card deleted successfully" });
      } else {
        throw new Error("Failed to delete card");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Error deleting card" });
    }
  }
}
