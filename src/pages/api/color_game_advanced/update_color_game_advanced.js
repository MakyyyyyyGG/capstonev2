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
    let { cards, color_game_advanced_set_id } = req.body;
    if (!Array.isArray(cards)) {
      cards = [cards];
    }
    try {
      const cardPromises = cards.map(async (card) => {
        // console.log("POST NEW CARDSs cards", req.body);

        if (card.insertedAudio) {
          const audioFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.wav`;
          card.insertedAudio = await saveFileToPublic(
            card.insertedAudio,
            audioFileName,
            "color_game_advanced/audio"
          );
          console.log(`Audio URI: ${card.insertedAudio}`);
        }
        const imageFileNames = card.images.filter((image) => image !== null);
        const colorArray = card.colors.filter((color) => color !== null);

        return query({
          query: `INSERT INTO color_game_advanced (color_game_advanced_set_id, images, color, audio) VALUES (?, ?, ?, ?)`,
          values: [
            color_game_advanced_set_id,
            imageFileNames.join(","),
            colorArray.join(","),

            card.insertedAudio,
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
    const { color_game_advanced_id } = req.query;
    console.log("color_game_advanced_id", color_game_advanced_id);
    try {
      const result = await query({
        query:
          "DELETE FROM color_game_advanced WHERE color_game_advanced_id = ?",
        values: [color_game_advanced_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Card deleted successfully: ${color_game_id}`);
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
