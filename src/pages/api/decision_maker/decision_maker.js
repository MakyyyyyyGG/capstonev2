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
  const { title, room_code, account_id, cards, difficulty } = req.body;
  try {
    const gameType = "Decision Maker";
    const gameResult = await query({
      query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameType, difficulty],
    });
    const gameId = gameResult.insertId;

    const groupResult = await query({
      query: `INSERT INTO decision_maker_sets (title, room_code, account_id, game_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
      values: [title, room_code, account_id, gameId],
    });

    const groupId = groupResult.insertId;

    const cardPromises = cards.map(async (card) => {
      if (card.image && card.image.startsWith("data:")) {
        const imageFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        card.image = await uploadToFirebase(
          card.image,
          imageFileName,
          "decision_maker/images"
        );
      } else if (card.image && !card.image.startsWith("http")) {
        card.image = null;
      }
      return query({
        query: `INSERT INTO decision_maker (decision_maker_set_id, word, image, correct_answer) VALUES (?, ?, ?, ?)`,
        values: [groupId, card.word, card.image, card.correct_answer],
      });
    });

    await Promise.all(cardPromises);
    res.status(200).json({ groupId, gameId });
  } catch (error) {
    console.error("Error creating game or group", error);
    res.status(500).json({ error: "Error creating game or group" });
  }
};

const handleGetRequest = async (req, res) => {
  const { game_id, account_id } = req.query;
  try {
    if (account_id) {
      const ownerResults = await query({
        query:
          "SELECT * FROM decision_maker_sets JOIN teachers ON decision_maker_sets.account_id = teachers.account_id WHERE decision_maker_sets.account_id = ? AND decision_maker_sets.game_id = ?",
        values: [account_id, game_id],
      });

      if (!ownerResults.length) {
        return res.status(403).json({ error: "Unauthorized access" });
      }
    }

    const gameResults = await query({
      query:
        "SELECT * FROM decision_maker_sets JOIN games ON decision_maker_sets.game_id = games.game_id WHERE decision_maker_sets.game_id = ?",
      values: [game_id],
    });

    if (!gameResults.length) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const groupId = gameResults[0].decision_maker_set_id;

    const cardsResults = await query({
      query: `
        SELECT decision_maker.*, games.title, games.difficulty, games.game_id
        FROM decision_maker 
        JOIN decision_maker_sets ON decision_maker.decision_maker_set_id = decision_maker_sets.decision_maker_set_id 
        JOIN games ON decision_maker_sets.game_id = games.game_id
        WHERE decision_maker.decision_maker_set_id = ?
      `,
      values: [groupId],
    });

    if (!cardsResults.length) {
      res.status(404).json({ error: "Cards not found" });
      return;
    }

    const cardsWithImageUrl = cardsResults.map((card) => ({
      ...card,
      imageUrl: card.image,
    }));

    res.status(200).json(cardsWithImageUrl);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Error fetching game" });
  }
};

const handlePutRequest = async (req, res) => {
  const { decision_maker_id } = req.query;
  const { cards, title, difficulty, game_id } = req.body;

  try {
    const currentCardResults = await query({
      query: "SELECT * FROM decision_maker WHERE decision_maker_id = ?",
      values: [decision_maker_id],
    });

    if (!currentCardResults.length) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const currentCard = currentCardResults[0];

    // Delete old image from Firebase if it exists and is being replaced
    if (
      currentCard.image &&
      currentCard.image.includes("firebase") &&
      cards.imageBlob
    ) {
      await deleteFromFirebase(currentCard.image);
    }

    if (cards.imageBlob && !cards.imageBlob.startsWith("https://")) {
      const imageFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.png`;
      cards.imageBlob = await uploadToFirebase(
        cards.imageBlob,
        imageFileName,
        "decision_maker/images"
      );
    }

    await query({
      query:
        "UPDATE decision_maker SET word = ?, image = ?, correct_answer = ? WHERE decision_maker_id = ?",
      values: [
        cards.word,
        cards.imageBlob || cards.image,
        cards.correct_answer,
        cards.decision_maker_id,
      ],
    });

    const updateTitleResult = await query({
      query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
      values: [title, difficulty, game_id],
    });

    if (updateTitleResult.affectedRows > 0) {
      res.status(200).json({ message: "Cards and title updated successfully" });
    } else {
      res.status(404).json({ error: "Failed to update the title" });
    }
  } catch (error) {
    console.error("Error updating game:", error);
    res.status(500).json({ error: "Error updating game" });
  }
};

const handleDeleteRequest = async (req, res) => {
  const { game_id } = req.query;
  try {
    // Get all cards to delete their images from Firebase
    const cards = await query({
      query: `
        SELECT decision_maker.* 
        FROM decision_maker 
        JOIN decision_maker_sets ON decision_maker.decision_maker_set_id = decision_maker_sets.decision_maker_set_id 
        WHERE decision_maker_sets.game_id = ?
      `,
      values: [game_id],
    });

    // Delete images from Firebase
    for (const card of cards) {
      if (card.image && card.image.includes("firebase")) {
        await deleteFromFirebase(card.image);
      }
    }

    const result = await query({
      query: "DELETE FROM games WHERE game_id = ?",
      values: [game_id],
    });

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Card deleted successfully" });
    } else {
      res.status(404).json({ error: "Card not found" });
    }
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Error deleting card" });
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
