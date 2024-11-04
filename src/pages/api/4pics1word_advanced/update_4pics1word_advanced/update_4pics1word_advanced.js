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
        maxSizeBytes: "52428800", // 50MB in bytes
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
      sizeLimit: "50mb",
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
        const { four_pics_advanced_set_id, word, images, correct_answer } =
          card;
        const imageFileNames = [];
        for (const image of images) {
          if (image) {
            if (image.startsWith("http")) {
              // If the image is a URL, use it directly
              imageFileNames.push(image);
            } else {
              // If the image is a base64 string, upload it to Firebase
              const imageFileName = `${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}.png`;
              const uploadedImageUrl = await uploadToFirebase(
                image,
                imageFileName,
                "four_pics_advanced/images"
              );
              imageFileNames.push(uploadedImageUrl);
            }
          } else {
            imageFileNames.push(null);
          }
        }
        const correctAnswers = card.correct_answers.join(",");

        const result = await query({
          query:
            "INSERT INTO four_pics_advanced (four_pics_advanced_set_id, word, image1, image2, image3, image4, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)",
          values: [
            four_pics_advanced_set_id,
            word,
            ...imageFileNames,
            correctAnswers,
          ],
        });

        if (result.affectedRows > 0) {
          console.log(`Card created successfully: ${result.insertId}`);
        } else {
          throw new Error("Failed to create card");
        }
      }
      res.status(200).json({ message: "Cards created successfully" });
    } catch (error) {
      console.error("Error updating 4pics1word_advanced:", error);
      res.status(500).json({ error: "Error updating 4pics1word_advanced" });
    }
  } else if (req.method === "DELETE") {
    const { four_pics_advanced_id } = req.query;
    console.log("four_pics_advanced_id", four_pics_advanced_id);
    try {
      // Get the card data to delete images from Firebase
      const cardResult = await query({
        query:
          "SELECT image1, image2, image3, image4 FROM four_pics_advanced WHERE four_pics_advanced_id = ?",
        values: [four_pics_advanced_id],
      });

      if (cardResult.length > 0) {
        const card = cardResult[0];
        // Delete images from Firebase
        for (let i = 1; i <= 4; i++) {
          const imageUrl = card[`image${i}`];
          if (imageUrl && imageUrl.includes("firebase")) {
            await deleteFromFirebase(imageUrl);
          }
        }
      }

      const result = await query({
        query: "DELETE FROM four_pics_advanced WHERE four_pics_advanced_id = ?",
        values: [four_pics_advanced_id],
      });
      if (result.affectedRows > 0) {
        console.log(`Card deleted successfully: ${four_pics_advanced_id}`);
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
