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
  if (req.method === "DELETE") {
    const { sequence_game_id } = req.query;
    console.log("Sequence ID:", sequence_game_id);

    try {
      const flashcardResults = await query({
        query: "DELETE FROM sequence_game WHERE sequence_game_id = ?",
        values: [sequence_game_id],
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
  if (req.method === "POST") {
    let { sequences } = req.body;
    console.log("Sequences:", sequences);

    // Ensure flashcards is an array, even if a single object is sent
    if (!Array.isArray(sequences)) {
      sequences = [sequences];
    }

    try {
      for (const sequence of sequences) {
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
              "flashcards/images"
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
            "flashcards/audio"
          );
          console.log(`Audio URI: ${sequence.audio}`);
        }

        const flashcardResults = await query({
          query:
            "INSERT INTO sequence_game (sequence_game_set_id, step, image, audio) VALUES (?, ?, ?, ?)",
          values: [
            sequence.sequence_game_set_id,
            sequence.step,
            sequence.image,
            sequence.audio,
          ],
        });

        if (flashcardResults.affectedRows > 0) {
          res.status(200).json({ message: "Sequence created successfully" });
        } else {
          res.status(404).json({ error: "Sequence not found" });
        }
      }
    } catch (error) {
      console.error("Error creating sequence:", error);
      res.status(500).json({ error: "Error creating sequence" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
