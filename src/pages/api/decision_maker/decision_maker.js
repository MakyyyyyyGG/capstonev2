import { query } from "@/lib/db";
import { image } from "@nextui-org/theme";
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
    return { error: "Invalid base64 string format" };
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
    const { title, account_id, room_code, cards } = req.body;
    // console.log("POST data", title, account_id, room_code, cards);
    try {
      const gameType = "Decision Maker";
      const gameResult = await query({
        query:
          "INSERT INTO games (title, room_code, account_id, game_type) VALUES (?, ?, ?, ?)",
        values: [title, room_code, account_id, gameType],
      });

      const gameId = gameResult.insertId;
      try {
        const groupResult = await query({
          query: `INSERT INTO decision_maker_sets (title, room_code, account_id, game_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
          values: [title, room_code, account_id, gameId],
        });
        const groupId = groupResult.insertId;
        const cardPromises = cards.map(async (card) => {
          if (card.image) {
            const imageFileName = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}.png`;
            card.image = await saveFileToPublic(
              card.image,
              imageFileName,
              "decision_maker/images"
            );
            console.log(`Image URI: ${card.image}`);
          }
          console.log("card", card);
          return query({
            query: `INSERT INTO decision_maker (decision_maker_set_id  ,word,image, correct_answer) VALUES (?, ?, ?, ?)`,
            values: [groupId, card.word, card.image, card.correct_answer],
          });
        });
        await Promise.all(cardPromises);
        res
          .status(200)
          .json({ message: "Game and group created successfully" });
      } catch (error) {
        console.error("Decision Maker set not created", error);
        res.status(500).json({ error: "Decision Maker set not created" });
      }
    } catch (error) {
      console.error("game not created", error);
      res.status(500).json({ error: "Game not created" });
    }
  } else if (req.method === "GET") {
    console.log("GET request received");
    const { game_id } = req.query;
    console.log(game_id);
    try {
      const gameResults = await query({
        query:
          "SELECT * FROM decision_maker_sets JOIN games ON decision_maker_sets.game_id = games.game_id WHERE decision_maker_sets.game_id = ?",
        values: [game_id],
      });
      if (!gameResults.length) {
        return res.status(404).json({ error: "Game not found" });
      }
      // console.log(gameResults);

      const groupId = gameResults[0].decision_maker_set_id;
      console.log("group id:", groupId);

      const cardsResults = await query({
        query: `
          SELECT decision_maker.*, games.title, games.difficulty, games.game_id
          FROM decision_maker 
          JOIN decision_maker_sets ON decision_maker.decision_maker_set_id = decision_maker_sets.decision_maker_set_id 
          JOIN games ON decision_maker_sets.game_id = games.game_id
          WHERE decision_maker.decision_maker_set_id = ?;
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
    const { title, game_id, cards } = req.body;
    const { decision_maker_id } = req.query;
    // console.log("PUT request received", title, game_id, cards);
    try {
      const currentCardResults = await query({
        query: "SELECT * FROM decision_maker WHERE decision_maker_id = ?",
        values: [decision_maker_id],
      });
      if (!currentCardResults.length) {
        return res.status(404).json({ error: "Card not found" });
      }
      const currentCard = currentCardResults[0];

      if (cards.imageBlob) {
        const imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        cards.imageBlob = await saveFileToPublic(
          cards.imageBlob,
          imageFileName,
          "decision_maker/images"
        );
        console.log(`Image URI: ${cards.imageBlob}`);
      }
      await query({
        query:
          "UPDATE decision_maker SET word = ?, image = ?, correct_answer = ? WHERE decision_maker_id = ?",
        values: [
          cards.word,
          cards.imageBlob || cards.image,
          cards.correct_answer,
          cards.decision_maker_id,
        ],
      });
      const updateTitleResult = await query({
        query: "UPDATE games SET title = ? WHERE game_id = ?",
        values: [title, game_id],
      });
      if (updateTitleResult.affectedRows > 0) {
        return res
          .status(200)
          .json({ message: "Cards and title updated successfully" });
      } else {
        return res.status(404).json({ error: "Failed to update the title" });
      }
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ error: "Error updating game" });
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
