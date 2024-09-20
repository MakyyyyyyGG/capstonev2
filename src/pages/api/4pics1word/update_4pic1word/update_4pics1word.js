import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

const saveFileToPublic = async (base64String, fileName, folder) => {
  const dataUriRegex =
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav));base64,/;
  const match = base64String.toString().match(dataUriRegex);

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
    let { cards } = req.body;
    console.log("cards", cards);

    // Ensure cards is an array
    if (!Array.isArray(cards)) {
      cards = [cards];
    }

    try {
      for (const card of cards) {
        const { four_pics_one_word_set_id, word, images } = card;
        const imageFileNames = [];
        for (const image of images) {
          if (image) {
            const imageFileName = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}.png`;
            const savedImagePath = await saveFileToPublic(
              image,
              imageFileName,
              "four_pics_one_word/images"
            );
            imageFileNames.push(savedImagePath);
          } else {
            imageFileNames.push(null);
          }
        }

        const result = await query({
          query:
            "INSERT INTO four_pics_one_word (four_pics_one_word_set_id, word, image1, image2, image3, image4) VALUES (?, ?, ?, ?, ?, ?)",
          values: [four_pics_one_word_set_id, word, ...imageFileNames],
        });

        if (result.affectedRows > 0) {
          console.log(`Card created successfully: ${result.insertId}`);
        } else {
          throw new Error("Failed to create card");
        }
      }
      res.status(200).json({ message: "Cards created successfully" });
    } catch (error) {
      console.error("Error updating 4pics1word:", error);
      res.status(500).json({ error: "Error updating 4pics1word" });
    }
  } else if (req.method === "DELETE") {
    const { four_pics_one_word_id } = req.query;
    console.log("four_pics_one_word_id", four_pics_one_word_id);
    try {
      const result = await query({
        query: "DELETE FROM four_pics_one_word WHERE four_pics_one_word_id = ?",
        values: [four_pics_one_word_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Card deleted successfully: ${four_pics_one_word_id}`);
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
