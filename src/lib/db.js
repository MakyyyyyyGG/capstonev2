import mysql from "mysql2/promise";

export async function query({ query, values = [] }) {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,
    password: process.env.MYSQL_PASSWORD,
  });

  try {
    const [result] = await connection.execute(query, values);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await connection.end();
  }
}
