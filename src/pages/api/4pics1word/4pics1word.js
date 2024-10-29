import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

const saveFileToPublic = async (base64String, fileName, folder) => {
  const dataUriRegex = /^data:(image\/(?:png|jpg|jpeg|gif));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 image data");

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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Increase the size limit to 10MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { room_code, account_id, cards, title, difficulty } = req.body;

    try {
      const gameType = "ThinkPic";
      const gameResult = await query({
        query: `INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)`,
        values: [title, room_code, account_id, gameType, difficulty],
      });
      const gameId = gameResult.insertId;

      try {
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
                  const fullPath = await saveFileToPublic(
                    image,
                    imageFileName,
                    "four_pics_one_word/images"
                  );
                  return fullPath;
                } else {
                  return image; // If image is a URL, return it directly
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
      } catch (groupError) {
        console.error(
          "Error inserting into four_pics_one_word_sets:",
          groupError
        );
        res
          .status(500)
          .json({ error: "Error inserting into four_pics_one_word_sets" });
      }
    } catch (gameError) {
      console.error("Error creating game:", gameError);
      res.status(500).json({ error: "Error creating game" });
    }
  } else if (req.method === "GET") {
    const { game_id } = req.query;

    //get4pic1word set
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
      console.log("groupId", groupId);

      try {
        const cardsResults = await query({
          query: `SELECT four_pics_one_word.*, games.title, games.difficulty, games.game_id
FROM four_pics_one_word 
JOIN four_pics_one_word_sets
ON four_pics_one_word.four_pics_one_word_set_id = four_pics_one_word_sets.four_pics_one_word_set_id 
JOIN games 
ON four_pics_one_word_sets.game_id = games.game_id
WHERE four_pics_one_word.four_pics_one_word_set_id = ?`,
          values: [groupId],
        });

        if (!cardsResults.length) {
          res.status(404).json({ error: "Cards not found" });
          return;
        }
        // Add imageUrl field with same value as image
        const cardsWithImageUrl = cardsResults.map((card) => ({
          ...card,
          image1Url: card.image,
          image2Url: card.image2,
          image3Url: card.image3,
          image4Url: card.image4,
        }));
        res.status(200).json(cardsWithImageUrl);
      } catch (cardsError) {
        console.error("Error fetching cards:", cardsError);
        res.status(500).json({ error: "Error fetching cards" });
      }
    } catch (gameError) {
      console.error("Error fetching game:", gameError);
      res.status(500).json({ error: "Error fetching game" });
    }
  } else if (req.method === "DELETE") {
    const { game_id } = req.query;
    try {
      const deleteResults = await query({
        query: `DELETE FROM games WHERE game_id = ?`,
        values: [game_id],
      });
      if (deleteResults.affectedRows > 0) {
        res.status(200).json({ message: "Game deleted successfully" });
      } else {
        res.status(404).json({ error: "Game not found" });
      }
    } catch (deleteError) {
      console.error("Error deleting game:", deleteError);
      res.status(500).json({ error: "Error deleting game" });
    }
  } else if (req.method === "PUT") {
    const { four_pics_one_word_id } = req.query;
    const { cards, title, difficulty, game_id } = req.body;
    console.log("cards", cards);

    try {
      // Get the current card data
      const currentCardResults = await query({
        query:
          "SELECT * FROM four_pics_one_word WHERE four_pics_one_word_id = ?",
        values: [four_pics_one_word_id],
      });

      if (!currentCardResults.length) {
        return res.status(404).json({ error: "Card not found" });
      }

      const currentCard = currentCardResults[0];
      let imageFileNames = [];

      // Loop through images and update only if the new image is different
      for (let i = 1; i <= 4; i++) {
        const imageKey = `image${i}`;
        const newImage = cards.images[i - 1]; // Adjust indexing for images array

        if (newImage === null) {
          imageFileNames.push(null); // Make it null if image index is null
        } else if (newImage && newImage.startsWith("data:image")) {
          const imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;
          const savedImagePath = await saveFileToPublic(
            newImage,
            imageFileName,
            "four_pics_one_word/images"
          );
          imageFileNames.push(savedImagePath);
          console.log(`New image saved: ${savedImagePath}`);
        } else if (
          (newImage && newImage.startsWith("http://")) ||
          newImage.startsWith("https://")
        ) {
          // Accept image URL directly
          imageFileNames.push(newImage);
          console.log(`Image URL accepted: ${newImage}`);
        } else {
          imageFileNames.push(currentCard[imageKey]); // Retain old image if not changed
        }
      }

      // Update the images and word in the four_pics_one_word table
      const updateCardResult = await query({
        query:
          "UPDATE four_pics_one_word SET image1 = ?, image2 = ?, image3 = ?, image4 = ?, word = ? WHERE four_pics_one_word_id = ?",
        values: [...imageFileNames, cards.word, four_pics_one_word_id],
      });

      const getGameId = await query({
        query:
          "select * from four_pics_one_word_sets join games on four_pics_one_word_sets.game_id = games.game_id where four_pics_one_word_sets.game_id = ?",
        values: [game_id],
      });

      if (updateCardResult.affectedRows > 0) {
        // Also update the title in the four_pics_one_word_sets table
        const updateTitleResult = await query({
          query:
            "UPDATE games SET title = ?, difficulty = ? WHERE game_id = ? ",
          values: [title, difficulty, game_id],
        });

        if (updateTitleResult.affectedRows > 0) {
          return res
            .status(200)
            .json({ message: "Card and title updated successfully" });
        } else {
          return res.status(404).json({ error: "Failed to update the title" });
        }
      } else {
        return res.status(404).json({ error: "Card not found" });
      }
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ error: "Error updating card" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
