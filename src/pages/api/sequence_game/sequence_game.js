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
  const match = base64String.toString().match(dataUriRegex);

  if (!match) {
    throw new Error("Invalid base64 string");
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

const handlePostRequest = async (req, res) => {
  const { title, room_code, account_id, sequence, video, difficulty } =
    req.body;

  try {
    const gameType = "Sequence Game";
    const gameResult = await query({
      query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameType, difficulty],
    });
    const gameId = gameResult.insertId;

    const groupResult = await query({
      query: `INSERT INTO sequence_game_sets (title, room_code, account_id, game_id, created_at, video) VALUES (?, ?, ?, ?, NOW(), ?)`,
      values: [title, room_code, account_id, gameId, video],
    });

    const groupId = groupResult.insertId;

    const sequencePromises = sequence.map(async (sequence) => {
      let imageFileName = null;
      let audioFileName = null;

      if (sequence.image) {
        if (sequence.image.startsWith("data:image")) {
          imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;
          sequence.image = await saveFileToPublic(
            sequence.image,
            imageFileName,
            "sequence_game/images"
          );
        } else if (
          sequence.image.startsWith("http://") ||
          sequence.image.startsWith("https://")
        ) {
          console.log(`Image URL: ${sequence.image}`);
        } else {
          throw new Error("Invalid image format");
        }
      }

      if (sequence.audio) {
        audioFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.mp3`;
        sequence.audio = await saveFileToPublic(
          sequence.audio,
          audioFileName,
          "sequence_game/audio"
        );
      }

      return query({
        query: `INSERT INTO sequence_game (sequence_game_set_id, step, image, audio) VALUES (?, ?, ?, ?)`,
        values: [groupId, sequence.step, sequence.image, sequence.audio],
      });
    });

    await Promise.all(sequencePromises);
    res.status(200).json({ groupId, gameId });
  } catch (error) {
    console.error("Error creating sequence:", error);
    res.status(500).json({ error: "Error creating sequence" });
  }
};

const handleGetRequest = async (req, res) => {
  const { game_id } = req.query;

  try {
    const gameResults = await query({
      query:
        "SELECT * FROM sequence_game_sets JOIN games ON sequence_game_sets.game_id = games.game_id WHERE games.game_id = ?",
      values: [game_id],
    });

    if (!gameResults.length) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const sequenceGameSetId = gameResults[0].sequence_game_sets_id;

    const sequenceGameResults = await query({
      query: `SELECT sequence_game.*, games.title, games.difficulty, games.game_id, sequence_game_sets.video
              FROM sequence_game
              JOIN sequence_game_sets ON sequence_game.sequence_game_set_id = sequence_game_sets.sequence_game_sets_id
              JOIN games ON sequence_game_sets.game_id = games.game_id
              WHERE sequence_game.sequence_game_set_id = ?`,
      values: [sequenceGameSetId],
    });

    if (!sequenceGameResults.length) {
      res.status(404).json({ error: "Sequence not found" });
      return;
    }

    res.status(200).json(sequenceGameResults);
  } catch (error) {
    console.error("Error fetching sequence:", error);
    res.status(500).json({ error: "Error fetching sequence" });
  }
};

const handlePutRequest = async (req, res) => {
  const { sequence_id } = req.query;
  const { sequence, title, difficulty, video, game_id } = req.body;

  try {
    const currentSequenceResults = await query({
      query: "SELECT * FROM sequence_game WHERE sequence_game_id = ?",
      values: [sequence_id],
    });

    if (!currentSequenceResults.length) {
      res.status(404).json({ error: "Sequence not found" });
      return;
    }

    const currentSequence = currentSequenceResults[0];

    if (sequence.image && sequence.image !== currentSequence.image) {
      if (sequence.image.startsWith("data:image")) {
        const imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        sequence.image = await saveFileToPublic(
          sequence.image,
          imageFileName,
          "sequence_game/images"
        );
      } else if (
        sequence.image.startsWith("http://") ||
        sequence.image.startsWith("https://")
      ) {
        console.log(`Image URL accepted: ${sequence.image}`);
      } else {
        sequence.image = currentSequence.image;
      }
    } else {
      sequence.image = currentSequence.image;
    }

    if (sequence.audio && sequence.audio !== currentSequence.audio) {
      const audioFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.mp3`;
      sequence.audio = await saveFileToPublic(
        sequence.audio,
        audioFileName,
        "sequence_game/audio"
      );
    } else {
      sequence.audio = currentSequence.audio;
    }

    await query({
      query:
        "UPDATE sequence_game SET step = ?, image = ?, audio = ? WHERE sequence_game_id = ?",
      values: [sequence.step, sequence.image, sequence.audio, sequence_id],
    });

    await query({
      query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
      values: [title, difficulty, game_id],
    });

    const sequenceGameSetId = currentSequence.sequence_game_set_id;
    await query({
      query:
        "UPDATE sequence_game_sets SET video = ? WHERE sequence_game_sets_id = ?",
      values: [video, sequenceGameSetId],
    });

    res.status(200).json({ message: "Sequence updated successfully" });
  } catch (error) {
    console.error("Error updating sequence:", error);
    res.status(500).json({ error: "Error updating sequence" });
  }
};

const handleDeleteRequest = async (req, res) => {
  const { game_id } = req.query;

  try {
    const flashcardResults = await query({
      query: "DELETE FROM games WHERE game_id = ?",
      values: [game_id],
    });

    if (flashcardResults.affectedRows > 0) {
      res.status(200).json({ message: "Sequence deleted successfully" });
    } else {
      res.status(404).json({ error: "Sequence not found" });
    }
  } catch (error) {
    console.error("Error deleting sequence:", error);
    res.status(500).json({ error: "Error deleting sequence" });
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
