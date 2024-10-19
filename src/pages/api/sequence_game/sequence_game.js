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
    const { title, room_code, account_id, sequence, video } = req.body;
    // console.log(req.body);
    try {
      const gameType = "Sequence Game";
      const gameResult = await query({
        query: `INSERT INTO games (title, room_code, account_id, game_type) VALUES (?, ?, ?, ?)`,
        values: [title, room_code, account_id, gameType],
      });
      const gameId = gameResult.insertId;

      try {
        // Insert the flashcard group
        const groupResult = await query({
          query: `INSERT INTO sequence_game_sets (title, room_code, account_id, game_id, created_at, video) VALUES (?, ?, ?, ?, NOW(), ?)`,
          values: [title, room_code, account_id, gameId, video],
        });

        // Get the last inserted group ID
        const groupId = groupResult.insertId;

        // Insert each flashcard associated with the group
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
              console.log(`Image URI: ${sequence.image}`);
            } else if (
              sequence.image.startsWith("http://") ||
              sequence.image.startsWith("https://")
            ) {
              // Accept image URL directly
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
            console.log(`Audio URI: ${sequence.audio}`);
          }
          console.log("set ID", groupId);
          return query({
            query: `INSERT INTO sequence_game (sequence_game_set_id, step, image, audio) VALUES (?, ?, ?, ?)`,
            values: [
              groupId, // Use the auto-incremented group ID
              sequence.step,
              sequence.image,
              sequence.audio,
            ],
          });
        });

        await Promise.all(sequencePromises); // Wait for all flashcard insertions to complete
        res.status(200).json({ groupId, gameId });
      } catch (error) {
        console.error("Error creating sequence:", error);
        res.status(500).json({ error: "Error creating sequence" });
      }
    } catch (error) {
      console.error("Error creating sequence:", error);
      res.status(500).json({ error: "Error creating sequence" });
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
          "SELECT * FROM sequence_game_sets JOIN games ON sequence_game_sets.game_id = games.game_id WHERE games.game_id = ?",
        values: [game_id],
      });

      if (!gameResults.length) {
        res.status(404).json({ error: "Game not found" });
        return;
      }

      // console.log("gameResults:", gameResults);
      const sequenceGameSetId = gameResults[0].sequence_game_sets_id;

      try {
        // Selecting all flashcards in a flashcard set
        const sequenceGameResults = await query({
          query: `SELECT sequence_game.*, games.title, games.difficulty, games.game_id, sequence_game_sets.video
FROM sequence_game
JOIN sequence_game_sets ON sequence_game.sequence_game_set_id = sequence_game_sets.sequence_game_sets_id
JOIN games ON sequence_game_sets.game_id = games.game_id
WHERE sequence_game.sequence_game_set_id = ?;
`,
          values: [sequenceGameSetId],
        });

        if (!sequenceGameResults.length) {
          res.status(404).json({ error: "Sequence not found" });
          return;
        }

        // Return the array of flashcards directly
        res.status(200).json(sequenceGameResults);
      } catch (error) {
        console.error("Error fetching sequence:", error);
        res.status(500).json({ error: "Error fetching sequence" });
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ error: "Error fetching game" });
    }
  }
  if (req.method === "PUT") {
    const { sequence_id } = req.query;
    // console.log("Sequence ID:", sequence_id);
    const { sequence, title, difficulty, video, game_id } = req.body;
    // console.log("Sequence:", sequence);

    try {
      // Get the current flashcard data
      const currentSequenceResults = await query({
        query: "SELECT * FROM sequence_game WHERE sequence_game_id = ?",
        values: [sequence_id],
      });

      if (!currentSequenceResults.length) {
        res.status(404).json({ error: "Sequence not found" });
        return;
      }

      const currentSequence = currentSequenceResults[0];

      let imageFileName = null;
      let audioFileName = null;
      if (sequence.image && sequence.image !== currentSequence.image) {
        if (sequence.image.startsWith("data:image")) {
          imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;
          sequence.image = await saveFileToPublic(
            sequence.image,
            imageFileName,
            "sequence_game/images"
          );
          console.log(`Image URI: ${sequence.image}`);
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
        audioFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.mp3`;
        sequence.audio = await saveFileToPublic(
          sequence.audio,
          audioFileName,
          "sequence_game/audio"
        );
        console.log(`Audio URI: ${sequence.audio}`);
      } else {
        sequence.audio = currentSequence.audio;
      }
      console.log("sequence", sequence.audio);
      const flashcardResults = await query({
        query:
          "UPDATE sequence_game SET step = ?, image = ?, audio = ? WHERE sequence_game_id = ?",
        values: [sequence.step, sequence.image, sequence.audio, sequence_id],
      });

      // Also update the title in the games table
      const updateTitleResult = await query({
        query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
        values: [title, difficulty, game_id],
      });
      //update video
      const sequenceGameSetId = currentSequenceResults[0].sequence_game_set_id;
      const updateVideoResult = await query({
        query:
          "UPDATE sequence_game_sets SET video = ? WHERE sequence_game_sets_id = ?",
        values: [video, sequenceGameSetId],
      });

      if (flashcardResults.affectedRows > 0) {
        res.status(200).json({ message: "Sequence updated successfully" });
      } else {
        res.status(404).json({ error: "Sequence not found" });
      }
    } catch (error) {
      console.error("Error updating sequence:", error);
      res.status(500).json({ error: "Error updating sequence" });
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
        res.status(200).json({ message: "Sequence deleted successfully" });
      } else {
        res.status(404).json({ error: "Sequence not found" });
      }
    } catch (error) {
      console.error("Error deleting sequence:", error);
      res.status(500).json({ error: "Error deleting sequence" });
    }
  }
}
