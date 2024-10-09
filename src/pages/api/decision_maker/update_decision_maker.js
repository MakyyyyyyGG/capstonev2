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
        // console.log("POST NEW CARDSs cards", req.body);

        if (card.imageBlob) {
          const imageFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.png`;
          card.imageBlob = await saveFileToPublic(
            card.imageBlob,
            imageFileName,
            "decision_maker/images"
          );
          console.log(`Image URI: ${card.imageBlob}`);
        }

        return query({
          query: `INSERT INTO decision_maker (decision_maker_set_id, image, correct_answer, word ) VALUES (?, ?, ?, ?)`,
          values: [
            decision_maker_set_id,

            card.imageBlob || card.image,
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
      const result = await query({
        query: "DELETE FROM decision_maker WHERE decision_maker_id = ?",
        values: [decision_maker_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Card deleted successfully: ${decision_maker_id}`);
        res.status(200).json({ message: "Card deleted successfully" });
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
