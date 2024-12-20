import { query } from "@/lib/db";
import fs from "fs";
import path from "path";
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Increase the size limit to 50MB
    },
  },
};

const saveFileToPublic = async (base64String, fileName, folder) => {
  const dataUriRegex =
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav));base64,/;
  const match = base64String.toString().match(dataUriRegex);

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
    const { title, room_code, account_id, flashcards } = req.body;

    try {
      const gameType = "flashcard";
      const gameResult = await query({
        query: `INSERT INTO games (title, room_code, account_id, game_type) VALUES (?, ?, ?, ?)`,
        values: [title, room_code, account_id, gameType],
      });
      const gameId = gameResult.insertId;

      try {
        // Insert the flashcard group
        const groupResult = await query({
          query: `INSERT INTO flashcard_sets (title, room_code, account_id, game_id) VALUES (?, ?, ?, ?)`,
          values: [title, room_code, account_id, gameId],
        });

        // Get the last inserted group ID
        const groupId = groupResult.insertId;

        // Insert each flashcard associated with the group
        const flashcardPromises = flashcards.map(async (flashcard) => {
          let imageFileName = null;
          let audioFileName = null;

          if (flashcard.image) {
            imageFileName = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}.png`;
            flashcard.image = await saveFileToPublic(
              flashcard.image,
              imageFileName,
              "flashcards/images"
            );
            console.log(`Image URI: ${flashcard.image}`);
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
            console.log(`Audio URI: ${flashcard.audio}`);
          }

          return query({
            query: `INSERT INTO flashcards (flashcard_set_id, term, description, image, audio) VALUES (?, ?, ?, ?, ?)`,
            values: [
              groupId, // Use the auto-incremented group ID
              flashcard.term,
              flashcard.description,
              flashcard.image,
              flashcard.audio,
            ],
          });
        });

        await Promise.all(flashcardPromises); // Wait for all flashcard insertions to complete
        res.status(200).json({ groupId });
      } catch (error) {
        console.error("Error creating flashcards:", error);
        res.status(500).json({ error: "Error creating flashcards" });
      }
    } catch (error) {
      console.error("Error creating flashcards:", error);
      res.status(500).json({ error: "Error creating flashcards" });
    }
  }
  if (req.method === "GET") {
    console.log("GET request received");
    const { game_id } = req.query;
    console.log("Game ID:", game_id);

    // Get flashcard set
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

      try {
        // Selecting all flashcards in a flashcard set
        const flashcardsResults = await query({
          query:
            "SELECT * FROM flashcards JOIN flashcard_sets ON flashcards.flashcard_set_id = flashcard_sets.flashcard_set_id WHERE flashcards.flashcard_set_id = ?",
          values: [flashcardSetId],
        });

        if (!flashcardsResults.length) {
          res.status(404).json({ error: "Flashcards not found" });
          return;
        }

        // Randomize the flashcards
        const randomizedFlashcards = flashcardsResults.sort(
          () => Math.random() - 0.5
        );

        // Return the array of randomized flashcards directly
        res.status(200).json(randomizedFlashcards);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
        res.status(500).json({ error: "Error fetching flashcards" });
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ error: "Error fetching game" });
    }
  }
  if (req.method === "PUT") {
    const { flashcard_id } = req.query;
    const { flashcards } = req.body;

    try {
      // Get the current flashcard data
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
        imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        flashcards.image = await saveFileToPublic(
          flashcards.image,
          imageFileName,
          "flashcards/images"
        );
        console.log(`Image URI: ${flashcards.image}`);
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
        console.log(`Audio URI: ${flashcards.audio}`);
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
  }
  if (req.method === "DELETE") {
    const { game_id } = req.query;
    console.log("Game ID:", game_id);

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
  }
}
