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
    const { room_code, account_id, cards, title, difficulty } = req.body;
    const extractedColors = cards.map((card) => card.color);
    // console.log(extractedColors);
    // console.log(req.body);
    // console.log(cards);
    try {
      const gameType = "Color Game Advanced";
      const gameResult = await query({
        query:
          "INSERT INTO games (title, room_code, account_id, game_type, difficulty) VALUES (?, ?, ?, ?, ?)",
        values: [title, room_code, account_id, gameType, difficulty],
      });
      const gameId = gameResult.insertId;
      try {
        const groupResult = await query({
          query: `INSERT INTO color_game_advanced_sets (title, room_code, account_id, game_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
          values: [title, room_code, account_id, gameId],
        });
        const groupId = groupResult.insertId;
        const cardPromises = cards.map(async (card) => {
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

          //   console.log(
          //     "all data:",
          //     groupId,
          //     card.insertedAudio,
          //     ...colorArray,
          //     ...imageFileNames
          //   );
          return query({
            query: `INSERT INTO color_game_advanced (color_game_advanced_set_id, color ,images, audio) VALUES (?, ?, ?, ?)`,
            values: [
              groupId,
              colorArray.join(","),
              imageFileNames.join(","),
              card.insertedAudio,
            ],
          });
        });
        await Promise.all(cardPromises);
        res
          .status(200)
          .json({ message: "Game and group created successfully" });
      } catch (error) {
        console.error("Error inserting into color game advanced form:", error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }
}
