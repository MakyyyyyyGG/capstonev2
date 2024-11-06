import { query } from "@/lib/db";
import { storage } from "@/lib/firebaseConfig";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const uploadToFirebase = async (base64String, fileName, folder) => {
  const dataUriRegex = /^data:(image\/(?:png|jpg|jpeg|gif));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 image data");

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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

const handlePost = async (req, res) => {
  const { room_code, account_id, cards, title, difficulty } = req.body;

  try {
    const gameType = "ThinkPic";
    const gameResult = await query({
      query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameType, difficulty],
    });
    const gameId = gameResult.insertId;

    const groupResult = await query({
      query: `INSERT INTO four_pics_one_word_sets (title, room_code, account_id, game_id) VALUES (?, ?, ?, ?)`,
      values: [title, room_code, account_id, gameId],
    });
    const groupId = groupResult.insertId;

    const cardPromises = cards.map(async (card) => {
      const imageFileNames = await Promise.all(
        card.images.map(async (image) => {
          if (image) {
            if (image.startsWith("data:image")) {
              const imageFileName = `${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}.png`;
              return await uploadToFirebase(
                image,
                imageFileName,
                "four_pics_one_word/images"
              );
            } else {
              return image;
            }
          }
          return null;
        })
      );

      return query({
        query: `INSERT INTO four_pics_one_word (four_pics_one_word_set_id, image1, image2, image3, image4, word) VALUES (?, ?, ?, ?, ?, ?)`,
        values: [groupId, ...imageFileNames, card.word],
      });
    });
    await Promise.all(cardPromises);
    res
      .status(200)
      .json({ message: "Game and group created successfully", gameId });
  } catch (error) {
    console.error("Error creating game or group:", error);
    res.status(500).json({ error: "Error creating game or group" });
  }
};

const handleGet = async (req, res) => {
  const { game_id } = req.query;

  try {
    const gameResults = await query({
      query: `SELECT * FROM four_pics_one_word_sets JOIN games ON four_pics_one_word_sets.game_id = games.game_id WHERE four_pics_one_word_sets.game_id = ?`,
      values: [game_id],
    });

    if (!gameResults.length) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const groupId = gameResults[0].four_pics_one_word_set_id;

    const cardsResults = await query({
      query: `SELECT four_pics_one_word.*, games.title, games.difficulty, games.game_id
              FROM four_pics_one_word 
              JOIN four_pics_one_word_sets ON four_pics_one_word.four_pics_one_word_set_id = four_pics_one_word_sets.four_pics_one_word_set_id 
              JOIN games ON four_pics_one_word_sets.game_id = games.game_id
              WHERE four_pics_one_word.four_pics_one_word_set_id = ?`,
      values: [groupId],
    });

    if (!cardsResults.length) {
      res.status(404).json({ error: "Cards not found" });
      return;
    }

    const cardsWithImageUrl = cardsResults.map((card) => ({
      ...card,
      image1Url: card.image1,
      image2Url: card.image2,
      image3Url: card.image3,
      image4Url: card.image4,
    }));
    res.status(200).json(cardsWithImageUrl);
  } catch (error) {
    console.error("Error fetching game or cards:", error);
    res.status(500).json({ error: "Error fetching game or cards" });
  }
};

const handleDelete = async (req, res) => {
  const { game_id } = req.query;
  try {
    // Get image URLs before deleting
    const imageResults = await query({
      query: `
        SELECT image1, image2, image3, image4 
        FROM four_pics_one_word 
        JOIN four_pics_one_word_sets ON four_pics_one_word.four_pics_one_word_set_id = four_pics_one_word_sets.four_pics_one_word_set_id 
        WHERE four_pics_one_word_sets.game_id = ?`,
      values: [game_id],
    });

    // Delete images from Firebase
    for (const result of imageResults) {
      const images = [
        result.image1,
        result.image2,
        result.image3,
        result.image4,
      ];
      for (const imageUrl of images) {
        if (imageUrl && imageUrl.includes("firebase")) {
          await deleteFromFirebase(imageUrl);
        }
      }
    }

    const deleteResults = await query({
      query: `DELETE FROM games WHERE game_id = ?`,
      values: [game_id],
    });
    if (deleteResults.affectedRows > 0) {
      res.status(200).json({ message: "Game deleted successfully" });
    } else {
      res.status(404).json({ error: "Game not found" });
    }
  } catch (error) {
    console.error("Error deleting game:", error);
    res.status(500).json({ error: "Error deleting game" });
  }
};

const handlePut = async (req, res) => {
  const { four_pics_one_word_id } = req.query;
  const { cards, title, difficulty, game_id } = req.body;

  try {
    const currentCardResults = await query({
      query: "SELECT * FROM four_pics_one_word WHERE four_pics_one_word_id = ?",
      values: [four_pics_one_word_id],
    });

    if (!currentCardResults.length) {
      return res.status(404).json({ error: "Card not found" });
    }

    const currentCard = currentCardResults[0];
    const imageFileNames = await Promise.all(
      cards.images.map(async (newImage, i) => {
        if (newImage === null) {
          return null;
        } else if (newImage.startsWith("data:image")) {
          const imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;

          // Delete old image from Firebase if it exists
          const oldImage = currentCard[`image${i + 1}`];
          if (oldImage && oldImage.includes("firebase")) {
            await deleteFromFirebase(oldImage);
          }

          return await uploadToFirebase(
            newImage,
            imageFileName,
            "four_pics_one_word/images"
          );
        } else if (
          newImage.startsWith("http://") ||
          newImage.startsWith("https://")
        ) {
          return newImage;
        } else {
          return currentCard[`image${i + 1}`];
        }
      })
    );

    const updateCardResult = await query({
      query:
        "UPDATE four_pics_one_word SET image1 = ?, image2 = ?, image3 = ?, image4 = ?, word = ? WHERE four_pics_one_word_id = ?",
      values: [...imageFileNames, cards.word, four_pics_one_word_id],
    });

    if (updateCardResult.affectedRows > 0) {
      const updateTitleResult = await query({
        query: "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ?",
        values: [title, difficulty, game_id],
      });

      if (updateTitleResult.affectedRows > 0) {
        res
          .status(200)
          .json({ message: "Card and title updated successfully" });
      } else {
        res.status(404).json({ error: "Failed to update the title" });
      }
    } else {
      res.status(404).json({ error: "Card not found" });
    }
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Error updating card" });
  }
};

export default async function handler(req, res) {
  switch (req.method) {
    case "POST":
      await handlePost(req, res);
      break;
    case "GET":
      await handleGet(req, res);
      break;
    case "DELETE":
      await handleDelete(req, res);
      break;
    case "PUT":
      await handlePut(req, res);
      break;
    default:
      res.status(405).json({ message: "Method not allowed" });
  }
}
