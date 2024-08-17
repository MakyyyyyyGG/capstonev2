import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { account_id } = req.query;
    const usersData = await query({
      query: "SELECT * FROM teachers WHERE account_id = ?",
      values: [account_id],
    });
    res.status(200).json({ usersData });
  }

  if (req.method === "PUT") {
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
    } = req.body;
    const usersData = await query({
      query:
        "UPDATE teachers SET first_name = ?, last_name = ?, age = ?, gender = ?, bday = ?, region = ?, province = ?, municipality = ?, barangay = ? WHERE account_id = ?",
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
        account_id,
      ],
    });
    res.status(200).json({ usersData });
  }
}
