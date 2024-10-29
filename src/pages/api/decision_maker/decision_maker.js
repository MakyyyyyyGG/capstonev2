import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Increase the size limit to 10MB
    },
  },
};

const saveFileToPublic = async (base64String, fileName, folder) => {
  const dataUriRegex =
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav));base64,/;
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

const handlePostRequest = async (req, res) => {
  const { title, room_code, account_id, cards, difficulty } = req.body;
  try {
    const gameType = "Decision Maker";
    const gameResult = await query({
      query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameType, difficulty],
    });
    const gameId = gameResult.insertId;

    const groupResult = await query({
      query: `INSERT INTO decision_maker_sets (title, room_code, account_id, game_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
      values: [title, room_code, account_id, gameId],
    });

    const groupId = groupResult.insertId;

    const cardPromises = cards.map(async (card) => {
      if (card.image && card.image.startsWith("data:")) {
        const imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        card.image = await saveFileToPublic(
          card.image,
          imageFileName,
          "decision_maker/images"
        );
      } else if (card.image && !card.image.startsWith("http")) {
        card.image = null;
      }
      return query({
        query: `INSERT INTO decision_maker (decision_maker_set_id, word, image, correct_answer) VALUES (?, ?, ?, ?)`,
        values: [groupId, card.word, card.image, card.correct_answer],
      });
    });

    await Promise.all(cardPromises);
    res.status(200).json({ groupId, gameId });
  } catch (error) {
    console.error("Error creating game or group", error);
    res.status(500).json({ error: "Error creating game or group" });
  }
};

const handleGetRequest = async (req, res) => {
  const { game_id } = req.query;
  try {
    const gameResults = await query({
      query:
        "SELECT * FROM decision_maker_sets JOIN games ON decision_maker_sets.game_id = games.game_id WHERE decision_maker_sets.game_id = ?",
      values: [game_id],
    });

    if (!gameResults.length) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const groupId = gameResults[0].decision_maker_set_id;

    const cardsResults = await query({
      query: `
        SELECT decision_maker.*, games.title, games.difficulty, games.game_id
        FROM decision_maker 
        JOIN decision_maker_sets ON decision_maker.decision_maker_set_id = decision_maker_sets.decision_maker_set_id 
        JOIN games ON decision_maker_sets.game_id = games.game_id
        WHERE decision_maker.decision_maker_set_id = ?
      `,
      values: [groupId],
    });

    if (!cardsResults.length) {
      res.status(404).json({ error: "Cards not found" });
      return;
    }

    const cardsWithImageUrl = cardsResults.map((card) => ({
      ...card,
      imageUrl: card.image,
    }));

    res.status(200).json(cardsWithImageUrl);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Error fetching game" });
  }
};

const handlePutRequest = async (req, res) => {
  const { decision_maker_id } = req.query;
  const { cards, title, difficulty, game_id } = req.body;

  try {
    const currentCardResults = await query({
      query: "SELECT * FROM decision_maker WHERE decision_maker_id = ?",
      values: [decision_maker_id],
    });

    if (!currentCardResults.length) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const currentCard = currentCardResults[0];

    if (cards.imageBlob && !cards.imageBlob.startsWith("https://")) {
      const imageFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.png`;
      cards.imageBlob = await saveFileToPublic(
        cards.imageBlob,
        imageFileName,
        "decision_maker/images"
      );
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
      query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
      values: [title, difficulty, game_id],
    });

    if (updateTitleResult.affectedRows > 0) {
      res.status(200).json({ message: "Cards and title updated successfully" });
    } else {
      res.status(404).json({ error: "Failed to update the title" });
    }
  } catch (error) {
    console.error("Error updating game:", error);
    res.status(500).json({ error: "Error updating game" });
  }
};

const handleDeleteRequest = async (req, res) => {
  const { game_id } = req.query;
  try {
    const result = await query({
      query: "DELETE FROM games WHERE game_id = ?",
      values: [game_id],
    });

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Card deleted successfully" });
    } else {
      res.status(404).json({ error: "Card not found" });
    }
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Error deleting card" });
  }
};

export default async function handler(req, res) {
  switch (req.method) {
    case "POST":
      await handlePostRequest(req, res);
      break;
    case "GET":
      await handleGetRequest(req, res);
      break;
    case "PUT":
      await handlePutRequest(req, res);
      break;
    case "DELETE":
      await handleDeleteRequest(req, res);
      break;
    default:
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
