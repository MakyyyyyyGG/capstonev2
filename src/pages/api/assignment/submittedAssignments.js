import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { assignment_id } = req.query;
    console.log("assignment_id", assignment_id);

    try {
      // Get students who submitted based on assignment id
      const students = await query({
        query: `
            SELECT 
            students.first_name,
            students.last_name,
            students.account_id,
            assignment.title,
            submitted_assignment.*
          FROM students 
          JOIN submitted_assignment 
            ON students.account_id = submitted_assignment.account_id
		JOIN assignment on submitted_assignment.assignment_id = assignment.assignment_id
          WHERE submitted_assignment.assignment_id = ?;
        `,
        values: [assignment_id],
      });

      // If no students have submitted, return empty array
      if (!students.length) {
        res.status(200).json({ students: [] });
        return;
      }

      // Get submitted media for each student
      const studentsWithMedia = await Promise.all(
        students.map(async (student) => {
          const media = await query({
            query: `
              SELECT url
              FROM submitted_assignment_media
              WHERE assignment_id = ? AND account_id = ?
            `,
            values: [assignment_id, student.account_id],
          });

          return {
            first_name: student.first_name,
            last_name: student.last_name,
            account_id: student.account_id,
            grade: student.grade,
            submitted_at: student.created_at,
            assignment_title: student.title,
            media: media.reduce((acc, m, i) => {
              acc[i] = m.url;
              return acc;
            }, {}),
          };
        })
      );

      res.status(200).json({ students: studentsWithMedia });
    } catch (error) {
      console.error("Error fetching submitted assignments:", error);
      res.status(500).json({ error: error.message });
      return;
    }
  } else if (req.method === "PUT") {
    const { assignment_id, account_id, grade } = req.body;

    try {
      // Update the grade for the student's submission
      await query({
        query: `
          UPDATE submitted_assignment 
          SET grade = ?
          WHERE assignment_id = ? AND account_id = ?
        `,
        values: [grade, assignment_id, account_id],
      });

      res.status(200).json({ message: "Grade updated successfully" });
    } catch (error) {
      console.error("Error updating grade:", error);
      res.status(500).json({ error: error.message });
      return;
    }
  }
}
