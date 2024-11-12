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
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav)|video\/(?:mp4|webm));base64,/;
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
  const { title, room_code, account_id, sequence, video, difficulty } =
    req.body;

  console.log(req.body);

  try {
    const gameType = "Sequence Game";
    const gameResult = await query({
      query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameType, difficulty],
    });
    const gameId = gameResult.insertId;

    let videoUrl = video;
    if (video && video.startsWith("data:")) {
      const videoFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.mp4`;
      videoUrl = await uploadToFirebase(
        video,
        videoFileName,
        "sequence_game/videos"
      );
    }

    const groupResult = await query({
      query: `INSERT INTO sequence_game_sets (title, room_code, account_id, game_id, created_at, video) VALUES (?, ?, ?, ?, NOW(), ?)`,
      values: [title, room_code, account_id, gameId, videoUrl],
    });

    const groupId = groupResult.insertId;

    // Use for...of loop to ensure order is maintained
    for (const sequenceItem of sequence) {
      let imageUrl = sequenceItem.image;
      let audioUrl = sequenceItem.audio;

      if (sequenceItem.image) {
        if (sequenceItem.image.startsWith("data:image")) {
          const imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;
          imageUrl = await uploadToFirebase(
            sequenceItem.image,
            imageFileName,
            "sequence_game/images"
          );
        } else if (!sequenceItem.image.startsWith("http")) {
          throw new Error("Invalid image format");
        }
      }

      if (sequenceItem.audio) {
        const audioFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.mp3`;
        audioUrl = await uploadToFirebase(
          sequenceItem.audio,
          audioFileName,
          "sequence_game/audio"
        );
      }

      await query({
        query: `INSERT INTO sequence_game (sequence_game_set_id, step, image, audio) VALUES (?, ?, ?, ?)`,
        values: [groupId, sequenceItem.step, imageUrl, audioUrl],
      });
    }

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

    let imageUrl = sequence.image;
    if (sequence.image && sequence.image !== currentSequence.image) {
      if (sequence.image.startsWith("data:image")) {
        const imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        // Delete old image if it exists in Firebase
        if (
          currentSequence.image &&
          currentSequence.image.includes("firebase")
        ) {
          await deleteFromFirebase(currentSequence.image);
        }
        imageUrl = await uploadToFirebase(
          sequence.image,
          imageFileName,
          "sequence_game/images"
        );
      } else if (!sequence.image.startsWith("http")) {
        imageUrl = currentSequence.image;
      }
    }

    let audioUrl = sequence.audio;
    if (sequence.audio && sequence.audio !== currentSequence.audio) {
      const audioFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.mp3`;
      // Delete old audio if it exists in Firebase
      if (currentSequence.audio && currentSequence.audio.includes("firebase")) {
        await deleteFromFirebase(currentSequence.audio);
      }
      audioUrl = await uploadToFirebase(
        sequence.audio,
        audioFileName,
        "sequence_game/audio"
      );
    } else {
      audioUrl = currentSequence.audio;
    }

    await query({
      query:
        "UPDATE sequence_game SET step = ?, image = ?, audio = ? WHERE sequence_game_id = ?",
      values: [sequence.step, imageUrl, audioUrl, sequence_id],
    });

    await query({
      query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
      values: [title, difficulty, game_id],
    });

    let videoUrl = video;
    if (video && video.startsWith("data:")) {
      const videoFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.mp4`;
      videoUrl = await uploadToFirebase(
        video,
        videoFileName,
        "sequence_game/videos"
      );
    }

    const sequenceGameSetId = currentSequence.sequence_game_set_id;
    await query({
      query:
        "UPDATE sequence_game_sets SET video = ? WHERE sequence_game_sets_id = ?",
      values: [videoUrl, sequenceGameSetId],
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
    // Get all sequences to delete their assets from Firebase
    const sequences = await query({
      query: `
        SELECT s.image, s.audio, ss.video 
        FROM sequence_game s
        JOIN sequence_game_sets ss ON s.sequence_game_set_id = ss.sequence_game_sets_id
        WHERE ss.game_id = ?
      `,
      values: [game_id],
    });

    // Delete all assets from Firebase
    for (const sequence of sequences) {
      if (sequence.image && sequence.image.includes("firebase")) {
        await deleteFromFirebase(sequence.image);
      }
      if (sequence.audio && sequence.audio.includes("firebase")) {
        await deleteFromFirebase(sequence.audio);
      }
      if (sequence.video && sequence.video.includes("firebase")) {
        await deleteFromFirebase(sequence.video);
      }
    }

    const deleteResult = await query({
      query: "DELETE FROM games WHERE game_id = ?",
      values: [game_id],
    });

    if (deleteResult.affectedRows > 0) {
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
