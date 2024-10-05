import fs from "fs";
import path from "path";
import { query } from "@/lib/db";

// Helper function to delete an existing image file
// const deleteImageFile = (fileName) => {
//   const filePath = path.join(process.cwd(), "public", "images", fileName);
//   return new Promise((resolve, reject) => {
//     fs.unlink(filePath, (err) => {
//       if (err) {
//         console.error(`Failed to delete file: ${filePath}`, err);
//         reject(err);
//       } else {
//         console.log(`Deleted file: ${filePath}`);
//         resolve();
//       }
//     });
//   });
// };

// Helper function to write Base64 image data to a file
const saveImageToFile = async (base64String, fileName) => {
  const dataUriRegex = /^data:(image\/(?:png|jpg|jpeg|gif));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 image data");

  const imageType = match[1]; // e.g., 'png', 'jpg', 'jpeg', 'gif'
  const base64Data = base64String.replace(dataUriRegex, "");
  const filePath = path.join(process.cwd(), "public", "images", fileName);

  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, base64Data, "base64", (err) => {
      if (err) {
        console.error(`Failed to save file: ${filePath}`, err);
        reject(err);
      } else {
        console.log(`Saved file: ${filePath}`);
        resolve(`/images/${fileName}`);
      }
    });
  });
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { account_id } = req.query;
    try {
      const usersData = await query({
        query: "SELECT * FROM students WHERE account_id = ?",
        values: [account_id],
      });

      if (usersData.length > 0) {
        const user = usersData[0];
        res.status(200).json({ usersData: [user] });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  }

  if (req.method === "PUT") {
    console.log("req.body from server", req.body);
    const {
      account_id,
      first_name,
      last_name,
      age,
      gender,
      bday,
      region,
      province,
      municipality,
      barangay,
      profileImage,
    } = req.body;

    console.log("req.body from server", req.body);

    try {
      // Fetch existing user data
      const existingUserData = await query({
        query: "SELECT profile_image FROM students WHERE account_id = ?",
        values: [account_id],
      });

      let existingImageUrl =
        existingUserData.length > 0 ? existingUserData[0].profile_image : null;
      let imageUrl = null;

      if (profileImage) {
        // Generate a file name based on account_id
        const fileName = `profile_${account_id}.png`;

        // Delete existing image file if it exists
        // if (existingImageUrl) {
        //   const existingFileName = path.basename(existingImageUrl);
        //   await deleteImageFile(existingFileName);
        // }

        // Save the new image to the public/images folder
        imageUrl = await saveImageToFile(profileImage, fileName);
      }

      // Update the user data in the database
      const usersData = await query({
        query:
          "UPDATE students SET first_name = ?, last_name = ?, age = ?, gender = ?, bday = ?, region = ?, province = ?, municipality = ?, barangay = ?, profile_image = ? WHERE account_id = ?",
        values: [
          first_name || null,
          last_name || null,
          age || null,
          gender || null,
          bday || null,
          region || null,
          province || null,
          municipality || null,
          barangay || null,
          imageUrl || existingImageUrl, // Use new image URL or keep existing if no new image
          account_id,
        ],
      });

      res.status(200).json({ usersData });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user data" });
    }
  }
}
