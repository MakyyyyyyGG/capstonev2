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

const handleGetRequest = async (req, res) => {
  const { assignment_id, account_id } = req.query;

  try {
    // Get the grade from submitted_assignment table
    const gradeResult = await query({
      query: `
        SELECT grade FROM submitted_assignment 
        WHERE assignment_id = ? AND account_id = ?;
      `,
      values: [assignment_id, account_id],
    });

    const assignmentResult = await query({
      query: `
       SELECT * FROM submitted_assignment_media WHERE assignment_id = ? AND account_id = ?;
      `,
      values: [assignment_id, account_id],
    });

    if (!assignmentResult.length) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    // Transform array into object with media URLs
    const assignmentData = {
      assignment_id,
      grade: gradeResult[0]?.grade || null,
      media: assignmentResult.reduce((acc, curr, index) => {
        acc[index] = curr.url;
        return acc;
      }, {}),
    };

    res.status(200).json({ assignmentResult: assignmentData });
  } catch (error) {
    console.error("Error in handleGetRequest:", error);
    res.status(500).json({ error: error.message });
  }
};

const handlePostRequest = async (req, res) => {
  console.log("Received POST request:");
  const { account_id, assignment_id, mediaList } = JSON.parse(req.body);

  if (!Array.isArray(mediaList)) {
    res.status(400).json({ error: "mediaList must be an array" });
    return;
  }

  try {
    // First insert the assignment record
    const assignmentResult = await query({
      query:
        "INSERT INTO submitted_assignment (account_id, assignment_id, created_at) VALUES (?, ?, NOW())",
      values: [account_id, assignment_id],
    });

    const assignmentId = assignmentResult.insertId;

    console.log("Assignment ID:", assignmentId);

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
          "submitted_assignment/media"
        );
      }

      // Insert media record
      await query({
        query:
          "INSERT INTO submitted_assignment_media (assignment_id, url, account_id) VALUES (?, ?, ?)",
        values: [assignmentId, finalUrl, account_id], // Changed assignment_id to assignmentId
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
  const { deletedMediaURL, assignment_id } = req.body;
  console.log("Delete Request Data:", req.query);

  try {
    // Get media URLs for confirmation before deleting
    const mediaResults = await query({
      query:
        "SELECT url FROM submitted_assignment_media WHERE url = ? AND assignment_id = ?",
      values: [deletedMediaURL, assignment_id],
    });

    if (mediaResults.length === 0) {
      res.status(404).json({ error: "Media not found" });
      return;
    }

    // Delete media files from Firebase Storage
    for (const media of mediaResults) {
      if (media.url && media.url.includes("firebase")) {
        await deleteFromFirebase(media.url);
      }
    }

    // Delete specific media record from database
    const deleteResult = await query({
      query:
        "DELETE FROM submitted_assignment_media WHERE url = ? AND assignment_id = ?",
      values: [deletedMediaURL, assignment_id],
    });

    console.log("Delete result:", deleteResult);

    if (deleteResult.affectedRows === 0) {
      throw new Error("Failed to delete from database");
    }

    res.status(200).json({
      success: true,
      message: "Media deleted successfully",
      deletedRows: deleteResult.affectedRows,
    });
  } catch (error) {
    console.error("Error in handleDeleteRequest:", error);
    res.status(500).json({
      error: "Failed to delete media. Please try again.",
      details: error.message,
    });
  }
};

export default async function handler(req, res) {
  switch (req.method) {
    case "GET":
      await handleGetRequest(req, res);
      break;
    case "POST":
      await handlePostRequest(req, res);
      break;
    case "PUT":
      await handlePutRequest(req, res);
      break;
    case "DELETE":
      await handleDeleteRequest(req, res);
      break;
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
