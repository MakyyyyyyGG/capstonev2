import { query } from "@/lib/db";
import { storage } from "@/lib/firebaseConfig"; // Ensure you import Firebase storage
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import path from "path"; // Add path import to fix ReferenceError

const uploadImageToFirebase = async (imageBlob, fileName) => {
  // Convert blob to file with proper image type
  const file = new File([imageBlob], fileName, { type: imageBlob.type });

  // Create a reference for the new file in Firebase Storage
  const storageRef = ref(storage, `public/images/${fileName}`);

  try {
    // Upload the image file to Firebase with increased size limit
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        maxSizeBytes: "10485760", // 10MB limit
      },
    });

    // Get the public URL of the uploaded image
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log("Image successfully uploaded to Firebase");
    console.log("Image URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase:", error);
    console.log("Image upload failed");
    throw new Error("Error uploading image");
  }
};

const deleteImageFromFirebase = async (filePath) => {
  const fileRef = ref(storage, filePath);
  try {
    await deleteObject(fileRef);
    console.log(`Deleted file from Firebase: ${filePath}`);
  } catch (err) {
    console.warn(
      `Failed to delete file from Firebase (it may not exist): ${filePath}`
    );
  }
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Increase payload size limit to 10MB
    },
  },
};

export default async function updateProfilePicture(req, res) {
  if (req.method === "PUT") {
    // Configure Next.js API route to accept larger payloads

    const { account_id } = req.query;
    const { profile_image } = req.body;
    // console.log("profile_image:", profile_image);

    try {
      // Check if the user exists and get the existing profile image
      const [user] = await query({
        query: "SELECT profile_image FROM teachers WHERE account_id = ?",
        values: [account_id],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete existing image in Firebase if a new image is provided
      if (profile_image && user.profile_image) {
        const existingFilePath = `images/${path.basename(user.profile_image)}`;
        await deleteImageFromFirebase(existingFilePath);
      }

      // Upload the new image to Firebase Storage and get the URL
      let imageUrl = user.profile_image;
      if (profile_image) {
        // Convert base64 to blob
        const response = await fetch(profile_image);
        const blob = await response.blob();

        imageUrl = await uploadImageToFirebase(blob, `${account_id}.jpg`);
      }

      // Update the user's profile image in the database with the new URL
      await query({
        query: "UPDATE teachers SET profile_image = ? WHERE account_id = ?",
        values: [imageUrl, account_id],
      });

      return res
        .status(200)
        .json({ message: "Profile picture updated successfully", imageUrl });
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
