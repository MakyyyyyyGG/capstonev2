import { query } from "@/lib/db";
import { storage } from "@/lib/firebaseConfig";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const uploadToFirebase = async (base64String, fileName, folder) => {
  const dataUriRegex =
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 data");

  const mimeType = match[1];
  const base64Data = base64String.replace(dataUriRegex, "");
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });

  const storageRef = ref(storage, `public/${folder}/${fileName}`);

  try {
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        maxSizeBytes: "10485760",
      },
    });

    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log(`File uploaded to Firebase: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading to Firebase:", error);
    throw new Error("Error uploading file");
  }
};

const deleteFromFirebase = async (filePath) => {
  if (!filePath) return;
  const fileRef = ref(storage, filePath);
  try {
    await deleteObject(fileRef);
    console.log(`Deleted file from Firebase: ${filePath}`);
  } catch (err) {
    console.warn(`Failed to delete file from Firebase: ${filePath}`);
  }
};

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    const { flashcard_id } = req.query;
    console.log("Flashcard ID:", flashcard_id);

    try {
      // Get the flashcard data before deleting to get file URLs
      const [flashcard] = await query({
        query: "SELECT image, audio FROM flashcards WHERE flashcard_id = ?",
        values: [flashcard_id],
      });

      if (flashcard) {
        // Delete files from Firebase if they exist
        if (flashcard.image) {
          await deleteFromFirebase(
            `public/flashcards/images/${path.basename(flashcard.image)}`
          );
        }
        if (flashcard.audio) {
          await deleteFromFirebase(
            `public/flashcards/audio/${path.basename(flashcard.audio)}`
          );
        }
      }

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
        let imageUrl = null;
        let audioUrl = null;

        if (flashcard.image) {
          if (flashcard.image.startsWith("data:image")) {
            const imageFileName = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}.png`;
            imageUrl = await uploadToFirebase(
              flashcard.image,
              imageFileName,
              "flashcards/images"
            );
            console.log(`Image URL: ${imageUrl}`);
          } else if (
            flashcard.image.startsWith("http://") ||
            flashcard.image.startsWith("https://")
          ) {
            imageUrl = flashcard.image;
            console.log(`Using existing image URL: ${imageUrl}`);
          } else {
            throw new Error("Invalid image format");
          }
        }

        if (flashcard.audio) {
          const audioFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.mp3`;
          audioUrl = await uploadToFirebase(
            flashcard.audio,
            audioFileName,
            "flashcards/audio"
          );
          console.log(`Audio URL: ${audioUrl}`);
        }

        const flashcardResults = await query({
          query:
            "INSERT INTO flashcards (flashcard_set_id, term, description, image, audio) VALUES (?, ?, ?, ?, ?)",
          values: [
            flashcard.flashcard_set_id,
            flashcard.term,
            flashcard.description,
            imageUrl,
            audioUrl,
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
