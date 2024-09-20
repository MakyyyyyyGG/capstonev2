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
    const { flashcard_id } = req.query;
    console.log("Flashcard ID:", flashcard_id);

    try {
      const flashcardResults = await query({
        query: "DELETE FROM flashcards WHERE flashcard_id = ?",
        values: [flashcard_id],
      });

      if (flashcardResults.affectedRows > 0) {
        res.status(200).json({ message: "Flashcard deleted successfully" });
      } else {
        res.status(404).json({ error: "Flashcard not found" });
      }
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      res.status(500).json({ error: "Error deleting flashcard" });
    }
  }
  if (req.method === "POST") {
    let { flashcards } = req.body;
    console.log("Flashcards:", flashcards);

    // Ensure flashcards is an array, even if a single object is sent
    if (!Array.isArray(flashcards)) {
      flashcards = [flashcards];
    }

    try {
      for (const flashcard of flashcards) {
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

        const flashcardResults = await query({
          query:
            "INSERT INTO flashcards (flashcard_set_id, term, description, image, audio) VALUES (?, ?, ?, ?, ?)",
          values: [
            flashcard.flashcard_set_id,
            flashcard.term,
            flashcard.description,
            flashcard.image,
            flashcard.audio,
          ],
        });

        if (flashcardResults.affectedRows > 0) {
          res.status(200).json({ message: "Flashcard created successfully" });
        } else {
          res.status(404).json({ error: "Flashcard not found" });
        }
      }
    } catch (error) {
      console.error("Error creating flashcard:", error);
      res.status(500).json({ error: "Error creating flashcard" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
