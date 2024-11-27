import { query } from "@/lib/db";

export default async function handler(req, res) {
  const { assignment_id } = req.query;

  if (!assignment_id) {
    return res.status(400).json({ error: "Assignment ID is required" });
  }

  if (req.method === "DELETE") {
    try {
      // Delete individual media item by assignment_media_id
      const result = await query({
        query: "DELETE FROM assignment_media WHERE assignment_media_id = ?",
        values: [assignment_id],
      });

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Media not found" });
      }

      return res.status(200).json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error("Error deleting media:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  try {
    // Fetch assignment and media in parallel
    const [assignment, media] = await Promise.all([
      query({
        query: "SELECT * FROM assignment WHERE assignment_id = ?",
        values: [assignment_id],
      }),
      query({
        query: "SELECT * FROM assignment_media WHERE assignment_id = ?",
        values: [assignment_id],
      }),
    ]);

    if (!assignment.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.status(200).json({
      assignment: assignment[0], // Return single object instead of array
      media,
    });
  } catch (error) {
    console.error("Error in indivAssignment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
