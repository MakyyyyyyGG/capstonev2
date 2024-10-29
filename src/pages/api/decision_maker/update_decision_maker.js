import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
const saveFileToPublic = async (base64String, fileName, folder) => {
  console.log("im reached");
  const dataUriRegex =
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav));base64,/;
  const match = base64String.toString().match(dataUriRegex);

  if (!match) {
    throw new Error("Invalid base64 string format");
  }

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
    let { cards, decision_maker_set_id } = req.body;
    if (!Array.isArray(cards)) {
      cards = [cards];
    }
    try {
      const cardPromises = cards.map(async (card) => {
        let imageToSave;

        if (card.imageBlob) {
          // Check if it's a https URL
          if (card.imageBlob.startsWith("https://")) {
            imageToSave = card.imageBlob;
          } else {
            // Handle base64 image
            const imageFileName = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}.png`;
            imageToSave = await saveFileToPublic(
              card.imageBlob,
              imageFileName,
              "decision_maker/images"
            );
          }
          console.log(`Image saved: ${imageToSave}`);
        } else if (card.imageUrl) {
          imageToSave = card.imageUrl;
          console.log(`Using image URL: ${imageToSave}`);
        }

        return query({
          query: `INSERT INTO decision_maker (decision_maker_set_id, image, correct_answer, word ) VALUES (?, ?, ?, ?)`,
          values: [
            decision_maker_set_id,
            imageToSave || card.image,
            card.correct_answer,
            card.word,
          ],
        });
      });
      await Promise.all(cardPromises);
      res.status(200).json({ message: "Game and group created successfully" });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "DELETE") {
    const { decision_maker_id } = req.query;
    console.log("decision_maker_id", decision_maker_id);
    try {
      // Get the decision maker set id
      const decisionMakerSetResult = await query({
        query:
          "SELECT decision_maker_set_id FROM decision_maker WHERE decision_maker_id = ?",
        values: [decision_maker_id],
      });

      if (!decisionMakerSetResult.length) {
        throw new Error("Decision maker set not found");
      }

      const decision_maker_set_id =
        decisionMakerSetResult[0].decision_maker_set_id;
      console.log("decision_maker_set_id", decision_maker_set_id);
      const result = await query({
        query: "DELETE FROM decision_maker WHERE decision_maker_id = ?",
        values: [decision_maker_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Card deleted successfully: ${decision_maker_id}`);

        // Fetch remaining cards in the set
        const remainingCards = await query({
          query: "SELECT * FROM decision_maker WHERE decision_maker_set_id = ?",
          values: [decision_maker_set_id],
        });

        console.log("remainingCards", remainingCards.length);
        // Update difficulty based on remaining cards
        let newDifficulty;
        if (remainingCards.length >= 10) {
          newDifficulty = "hard";
        } else if (remainingCards.length >= 5) {
          newDifficulty = "medium";
        } else {
          newDifficulty = "easy";
        }

        // Update the difficulty in the games table
        await query({
          query:
            "UPDATE games SET difficulty = ? WHERE game_id = (SELECT game_id FROM decision_maker_sets WHERE decision_maker_set_id = ?)",
          values: [newDifficulty, decision_maker_set_id],
        });
        console.log("newDifficulty", newDifficulty);
        res.status(200).json({
          message: "Card deleted successfully and difficulty updated",
        });
      } else {
        throw new Error("Failed to delete card");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Error deleting card" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
