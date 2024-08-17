import mysql from "mysql2/promise";

let pool;

export async function query({ query, values = [] }) {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: 100, // Adjust this as needed
      queueLimit: 0,
    });
  }

  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
