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
      sizeLimit: "100mb",
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
        maxSizeBytes: "104857600", // 100MB in bytes
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

const handlePostRequest = async (req, res) => {
  const { title, room_code, account_id, flashcards } = req.body;
  try {
    const gameType = "Flashcard";
    const gameResult = await query({
      query: `INSERT INTO games (title, room_code, account_id, game_type, created_at) VALUES (?, ?, ?, ?, NOW())`,
      values: [title, room_code, account_id, gameType],
    });
    const gameId = gameResult.insertId;

    const groupResult = await query({
      query: `INSERT INTO flashcard_sets (title, room_code, account_id, game_id) VALUES (?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameId],
    });

    const groupId = groupResult.insertId;

    const flashcardPromises = flashcards.map(async (flashcard) => {
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
        } else if (flashcard.image.startsWith("http")) {
          imageUrl = flashcard.image;
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
      }

      return query({
        query: `INSERT INTO flashcards (flashcard_set_id, term, description, image, audio) VALUES (?, ?, ?, ?, ?)`,
        values: [
          groupId,
          flashcard.term,
          flashcard.description,
          imageUrl,
          audioUrl,
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

    let imageUrl = currentFlashcard.image;
    let audioUrl = currentFlashcard.audio;

    if (flashcards.image && flashcards.image !== currentFlashcard.image) {
      if (currentFlashcard.image) {
        await deleteFromFirebase(currentFlashcard.image);
      }

      if (flashcards.image.startsWith("data:image")) {
        const imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        imageUrl = await uploadToFirebase(
          flashcards.image,
          imageFileName,
          "flashcards/images"
        );
      } else if (flashcards.image.startsWith("http")) {
        imageUrl = flashcards.image;
      }
    }

    if (flashcards.audio && flashcards.audio !== currentFlashcard.audio) {
      if (currentFlashcard.audio) {
        await deleteFromFirebase(currentFlashcard.audio);
      }

      const audioFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.mp3`;
      audioUrl = await uploadToFirebase(
        flashcards.audio,
        audioFileName,
        "flashcards/audio"
      );
    }

    const flashcardResults = await query({
      query:
        "UPDATE flashcards SET term = ?, description = ?, image = ?, audio = ? WHERE flashcard_id = ?",
      values: [
        flashcards.term,
        flashcards.description,
        imageUrl,
        audioUrl,
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
    // Get all flashcards to delete their files from Firebase
    const flashcards = await query({
      query:
        "SELECT image, audio FROM flashcards JOIN flashcard_sets ON flashcards.flashcard_set_id = flashcard_sets.flashcard_set_id WHERE flashcard_sets.game_id = ?",
      values: [game_id],
    });

    // Delete files from Firebase
    for (const flashcard of flashcards) {
      if (flashcard.image) await deleteFromFirebase(flashcard.image);
      if (flashcard.audio) await deleteFromFirebase(flashcard.audio);
    }

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
