import fs from "fs/promises";
import path from "path";
import { query } from "@/lib/db";

const saveImageToFile = async (base64String, fileName) => {
  const dataUriRegex = /^data:(image\/(?:png|jpg|jpeg|gif));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 image data");

  const base64Data = base64String.replace(dataUriRegex, "");
  const filePath = path.join(process.cwd(), "public", "images", fileName);

  try {
    await fs.writeFile(filePath, base64Data, "base64");
    console.log(`Saved file: ${filePath}`);
    return `/images/${fileName}`;
  } catch (err) {
    console.error(`Failed to save file: ${filePath}`, err);
    throw new Error("Error saving image file");
  }
};

const deleteImageFile = async (fileName) => {
  const filePath = path.join(process.cwd(), "public", "images", fileName);
  try {
    await fs.unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (err) {
    console.warn(`Failed to delete file (it may not exist): ${filePath}`);
  }
};

export default async function updateProfilePicture(req, res) {
  if (req.method === "PUT") {
    const { account_id } = req.query;
    const { profile_image } = req.body;

    try {
      // Check if the user exists and get the existing profile image
      const [user] = await query({
        query: "SELECT profile_image FROM students WHERE account_id = ?",
        values: [account_id],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete existing image file if a new image is provided
      if (profile_image && user.profile_image) {
        const existingFileName = path.basename(user.profile_image);
        await deleteImageFile(existingFileName);
      }

      // Save the new image file if provided
      let imageUrl = user.profile_image;
      if (profile_image) {
        imageUrl = await saveImageToFile(profile_image, `${account_id}.jpg`);
      }

      // Update the user's profile image in the database
      await query({
        query: "UPDATE students SET profile_image = ? WHERE account_id = ?",
        values: [imageUrl, account_id],
      });

      return res
        .status(200)
        .json({ message: "Profile picture updated successfully" });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      return res
        .status(500)
        .json({ error: "Failed to update profile picture" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
