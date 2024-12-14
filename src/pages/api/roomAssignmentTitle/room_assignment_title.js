import { query } from "@/lib/db";

export default async function handler(req, res) {
  console.log("reached");
  if (req.method === "POST") {
    const { room_codes, account_id } = req.body;
    console.log(req.body);
    try {
      // Dynamically create placeholders for IN (?) based on the number of room codes
      const placeholders = room_codes.map(() => "?").join(", ");

      // Use the correct query with dynamically created placeholders
      const results = await query(
        `
        SELECT a.title, a.room_code
        FROM capstone.assignment AS a
        LEFT JOIN capstone.submitted_assignment AS sa 
          ON a.assignment_id = sa.assignment_id 
          AND sa.account_id = ? 
        WHERE a.room_code IN (${placeholders}) 
          AND sa.submitted_assignment_id IS NULL
        ORDER BY a.title;
        `,
        [account_id, ...room_codes] // Spread room_codes into the query
      );

      res.status(200).json(results);
      console.log("result", results);
    } catch (error) {
      console.error("Error fetching assignment titles:", error);
      res.status(500).json({ error: "Error fetching assignment titles" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
