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
  const { title, room_code, account_id, flashcards } = req.body;
  try {
    const gameType = "Flashcard";
    const gameResult = await query({
      query: `INSERT INTO games (title, room_code, account_id, game_type) VALUES (?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameType],
    });
    const gameId = gameResult.insertId;

    const groupResult = await query({
      query: `INSERT INTO flashcard_sets (title, room_code, account_id, game_id) VALUES (?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameId],
    });

    const groupId = groupResult.insertId;

    const flashcardPromises = flashcards.map(async (flashcard) => {
      let imageFileName = null;
      let audioFileName = null;

      if (flashcard.image) {
        if (flashcard.image.startsWith("data:image")) {
          imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;
          flashcard.image = await saveFileToPublic(
            flashcard.image,
            imageFileName,
            "flashcards/images"
          );
        } else if (
          flashcard.image.startsWith("http://") ||
          flashcard.image.startsWith("https://")
        ) {
          console.log(`Image URL: ${flashcard.image}`);
        } else {
          throw new Error("Invalid image format");
        }
      }

      if (flashcard.audio) {
        audioFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.mp3`;
        flashcard.audio = await saveFileToPublic(
          flashcard.audio,
          audioFileName,
          "flashcards/audio"
        );
      }

      return query({
        query: `INSERT INTO flashcards (flashcard_set_id, term, description, image, audio) VALUES (?, ?, ?, ?, ?)`,
        values: [
          groupId,
          flashcard.term,
          flashcard.description,
          flashcard.image,
          flashcard.audio,
        ],
      });
    });

    await Promise.all(flashcardPromises);
    res.status(200).json({ groupId, gameId });
  } catch (error) {
    console.error("Error creating flashcards:", error);
    res.status(500).json({ error: "Error creating flashcards" });
  }
};

const handleGetRequest = async (req, res) => {
  const { game_id } = req.query;
  try {
    const gameResults = await query({
      query:
        "SELECT * FROM flashcard_sets JOIN games ON flashcard_sets.game_id = games.game_id WHERE flashcard_sets.game_id = ?",
      values: [game_id],
    });

    if (!gameResults.length) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const flashcardSetId = gameResults[0].flashcard_set_id;

    const flashcardsResults = await query({
      query:
        "SELECT * FROM flashcards JOIN flashcard_sets ON flashcards.flashcard_set_id = flashcard_sets.flashcard_set_id WHERE flashcards.flashcard_set_id = ?",
      values: [flashcardSetId],
    });

    if (!flashcardsResults.length) {
      res.status(404).json({ error: "Flashcards not found" });
      return;
    }

    const flashcardsWithImageUrl = flashcardsResults.map((flashcard) => ({
      ...flashcard,
      imageUrl: flashcard.image,
    }));

    res.status(200).json(flashcardsWithImageUrl);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ error: "Error fetching flashcards" });
  }
};

const handlePutRequest = async (req, res) => {
  const { flashcard_id } = req.query;
  const { flashcards } = req.body;

  try {
    const currentFlashcardResults = await query({
      query: "SELECT * FROM flashcards WHERE flashcard_id = ?",
      values: [flashcard_id],
    });

    if (!currentFlashcardResults.length) {
      res.status(404).json({ error: "Flashcard not found" });
      return;
    }

    const currentFlashcard = currentFlashcardResults[0];

    let imageFileName = null;
    let audioFileName = null;
    if (flashcards.image && flashcards.image !== currentFlashcard.image) {
      if (flashcards.image.startsWith("data:image")) {
        imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        flashcards.image = await saveFileToPublic(
          flashcards.image,
          imageFileName,
          "flashcards/images"
        );
      } else if (
        flashcards.image.startsWith("http://") ||
        flashcards.image.startsWith("https://")
      ) {
        console.log(`Image URL accepted: ${flashcards.image}`);
      } else {
        flashcards.image = currentFlashcard.image;
      }
    } else {
      flashcards.image = currentFlashcard.image;
    }

    if (flashcards.audio && flashcards.audio !== currentFlashcard.audio) {
      audioFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.mp3`;
      flashcards.audio = await saveFileToPublic(
        flashcards.audio,
        audioFileName,
        "flashcards/audio"
      );
    } else {
      flashcards.audio = currentFlashcard.audio;
    }

    const flashcardResults = await query({
      query:
        "UPDATE flashcards SET term = ?, description = ?, image = ?, audio = ? WHERE flashcard_id = ?",
      values: [
        flashcards.term,
        flashcards.description,
        flashcards.image,
        flashcards.audio,
        flashcard_id,
      ],
    });

    if (flashcardResults.affectedRows > 0) {
      res.status(200).json({ message: "Flashcard updated successfully" });
    } else {
      res.status(404).json({ error: "Flashcard not found" });
    }
  } catch (error) {
    console.error("Error updating flashcard:", error);
    res.status(500).json({ error: "Error updating flashcard" });
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
      res.status(200).json({ message: "Flashcards deleted successfully" });
    } else {
      res.status(404).json({ error: "Flashcards not found" });
    }
  } catch (error) {
    console.error("Error deleting flashcards:", error);
    res.status(500).json({ error: "Error deleting flashcards" });
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
