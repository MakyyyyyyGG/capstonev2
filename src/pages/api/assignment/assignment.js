import { query } from "@/lib/db";
import { storage } from "@/lib/firebaseConfig";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

const uploadToFirebase = async (base64String, fileName, folder) => {
  console.log("Uploading to Firebase:", base64String, fileName, folder);
  const dataUriRegex =
    /^data:(image\/(?:png|jpg|jpeg|gif)|audio\/(?:mpeg|wav)|video\/(?:mp4));base64,/;
  const match = base64String.match(dataUriRegex);
  if (!match) throw new Error("Invalid Base64 data");

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
        maxSizeBytes: "104857600", // 100MB in bytes
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

const handlePostRequest = async (req, res) => {
  const { title, room_code, account_id, instruction, due_date, mediaList } =
    JSON.parse(req.body);

  if (!Array.isArray(mediaList)) {
    res.status(400).json({ error: "mediaList must be an array" });
    return;
  }

  try {
    // First insert the assignment record
    const assignmentResult = await query({
      query:
        "INSERT INTO assignment (title, room_code, account_id, instruction, created_at, due_date) VALUES (?, ?, ?, ?, NOW(), ?)",
      values: [title, room_code, account_id, instruction, due_date],
    });

    const assignmentId = assignmentResult.insertId;

    // Process each media item
    const mediaPromises = mediaList.map(async (media) => {
      let finalUrl = media.content;

      // Only upload to Firebase if it's a base64 data URI
      if (media.content.startsWith("data:")) {
        const extension = media.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.${extension}`;
        finalUrl = await uploadToFirebase(
          media.content,
          fileName,
          "assignment/media"
        );
      }

      // Insert media record
      await query({
        query:
          "INSERT INTO assignment_media (assignment_id, url) VALUES (?, ?)",
        values: [assignmentId, finalUrl],
      });

      return finalUrl;
    });

    const mediaResults = await Promise.all(mediaPromises);

    res.status(200).json({
      success: true,
      assignmentId,
      mediaResults,
    });
  } catch (error) {
    console.error("Error in handlePostRequest:", error);
    res.status(500).json({ error: error.message });
  }
};

const handleGetRequest = async (req, res) => {
  const { room_code } = req.query;

  try {
    const assignments = await query({
      query:
        "SELECT * FROM assignment WHERE room_code = ? ORDER BY created_at DESC",
      values: [room_code],
    });

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error in handleGetRequest:", error);
    res.status(500).json({ error: error.message });
  }
};

const handlePutRequest = async (req, res) => {
  const { assignment_id } = req.query;
  const { title, instruction, due_date, mediaList } = JSON.parse(req.body);

  if (!Array.isArray(mediaList)) {
    res.status(400).json({ error: "mediaList must be an array" });
    return;
  }

  try {
    // Update assignment record
    await query({
      query:
        "UPDATE assignment SET title = ?, instruction = ?, due_date = ? WHERE assignment_id = ?",
      values: [title, instruction, due_date, assignment_id],
    });

    // Get existing media
    const existingMedia = await query({
      query: "SELECT * FROM assignment_media WHERE assignment_id = ?",
      values: [assignment_id],
    });

    // Delete removed media from Firebase and database
    const newMediaUrls = mediaList.map((m) => m.content);
    for (const media of existingMedia) {
      if (!newMediaUrls.includes(media.url)) {
        await deleteFromFirebase(media.url);
        await query({
          query: "DELETE FROM assignment_media WHERE assignment_media_id = ?",
          values: [media.assignment_media_id],
        });
      }
    }

    // Process new media items
    const mediaPromises = mediaList.map(async (media) => {
      // Skip if media already exists
      const exists = existingMedia.some((m) => m.url === media.content);
      if (exists) return media.content;

      let finalUrl = media.content;

      // Only upload to Firebase if it's a base64 data URI
      if (media.content.startsWith("data:")) {
        const extension = media.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.${extension}`;
        finalUrl = await uploadToFirebase(
          media.content,
          fileName,
          "assignment/media"
        );
      }

      // Insert new media record
      await query({
        query:
          "INSERT INTO assignment_media (assignment_id, url) VALUES (?, ?)",
        values: [assignment_id, finalUrl],
      });

      return finalUrl;
    });

    const mediaResults = await Promise.all(mediaPromises);

    res.status(200).json({
      success: true,
      mediaResults,
    });
  } catch (error) {
    console.error("Error in handlePutRequest:", error);
    res.status(500).json({ error: error.message });
  }
};

const handleDeleteRequest = async (req, res) => {
  const { assignment_id } = req.query;

  try {
    // Get media files to delete from Firebase
    const mediaFiles = await query({
      query: "SELECT url FROM assignment_media WHERE assignment_id = ?",
      values: [assignment_id],
    });

    // Delete media files from Firebase
    for (const media of mediaFiles) {
      if (media.url.includes("firebase")) {
        await deleteFromFirebase(media.url);
      }
    }

    // Delete media records
    await query({
      query: "DELETE FROM assignment_media WHERE assignment_id = ?",
      values: [assignment_id],
    });

    // Delete assignment record
    await query({
      query: "DELETE FROM assignment WHERE assignment_id = ?",
      values: [assignment_id],
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in handleDeleteRequest:", error);
    res.status(500).json({ error: error.message });
  }
};

export default async function handler(req, res) {
  switch (req.method) {
    case "POST":
      await handlePostRequest(req, res);
      break;
    case "GET":
      await handleGetRequest(req, res);
      break;
    case "PUT":
      await handlePutRequest(req, res);
      break;
    case "DELETE":
      await handleDeleteRequest(req, res);
      break;
    default:
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
