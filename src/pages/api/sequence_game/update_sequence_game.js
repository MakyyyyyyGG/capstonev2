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

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    const { sequence_game_id } = req.query;
    console.log("Sequence ID:", sequence_game_id);
    try {
      // Get the sequence game set id
      const sequenceGameSetResult = await query({
        query:
          "SELECT sequence_game_set_id FROM sequence_game WHERE sequence_game_id = ?",
        values: [sequence_game_id],
      });

      if (!sequenceGameSetResult.length) {
        throw new Error("Sequence game set not found");
      }

      const sequence_game_set_id =
        sequenceGameSetResult[0].sequence_game_set_id;
      console.log("sequence_game_set_id", sequence_game_set_id);

      // Get current sequence data to delete files
      const currentSequence = await query({
        query:
          "SELECT image, audio FROM sequence_game WHERE sequence_game_id = ?",
        values: [sequence_game_id],
      });

      if (
        currentSequence[0].image &&
        currentSequence[0].image.includes("firebase")
      ) {
        await deleteFromFirebase(currentSequence[0].image);
      }
      if (
        currentSequence[0].audio &&
        currentSequence[0].audio.includes("firebase")
      ) {
        await deleteFromFirebase(currentSequence[0].audio);
      }

      const result = await query({
        query: "DELETE FROM sequence_game WHERE sequence_game_id = ?",
        values: [sequence_game_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Sequence deleted successfully: ${sequence_game_id}`);

        // Fetch remaining sequences in the set
        const remainingSequences = await query({
          query: "SELECT * FROM sequence_game WHERE sequence_game_set_id = ?",
          values: [sequence_game_set_id],
        });

        console.log("remainingSequences", remainingSequences.length);
        // Update difficulty based on remaining sequences
        let newDifficulty;
        if (remainingSequences.length >= 10) {
          newDifficulty = "hard";
        } else if (remainingSequences.length >= 5) {
          newDifficulty = "medium";
        } else {
          newDifficulty = "easy";
        }

        // Update the difficulty in the games table
        await query({
          query:
            "UPDATE games SET difficulty = ? WHERE game_id = (SELECT game_id FROM sequence_game_sets WHERE sequence_game_sets_id = ?)",
          values: [newDifficulty, sequence_game_set_id],
        });
        console.log("newDifficulty", newDifficulty);
        res.status(200).json({
          message: "Sequence deleted successfully and difficulty updated",
        });
      } else {
        throw new Error("Failed to delete sequence");
      }
    } catch (error) {
      console.error("Error deleting sequence:", error);
      res.status(500).json({ error: "Error deleting sequence" });
    }
  }
  if (req.method === "POST") {
    let { sequences } = req.body;
    console.log("Sequences:", sequences);

    // Ensure sequences is an array
    if (!Array.isArray(sequences)) {
      sequences = [sequences];
    }

    try {
      for (const sequence of sequences) {
        if (sequence.image) {
          if (sequence.image.startsWith("data:image")) {
            const imageFileName = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}.png`;
            sequence.image = await uploadToFirebase(
              sequence.image,
              imageFileName,
              "sequence_game/images"
            );
            console.log(`Image uploaded: ${sequence.image}`);
          } else if (
            !sequence.image.startsWith("http://") &&
            !sequence.image.startsWith("https://")
          ) {
            throw new Error("Invalid image format");
          }
        }

        if (sequence.audio) {
          const audioFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.mp3`;
          sequence.audio = await uploadToFirebase(
            sequence.audio,
            audioFileName,
            "sequence_game/audio"
          );
          console.log(`Audio uploaded: ${sequence.audio}`);
        }

        const sequenceResults = await query({
          query:
            "INSERT INTO sequence_game (sequence_game_set_id, step, image, audio) VALUES (?, ?, ?, ?)",
          values: [
            sequence.sequence_game_set_id,
            sequence.step,
            sequence.image,
            sequence.audio,
          ],
        });

        if (sequenceResults.affectedRows > 0) {
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
