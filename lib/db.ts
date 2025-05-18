import mysql from "mysql2/promise"

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "inventory_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Helper function to execute SQL queries
export async function executeQuery<T>({ query, values = [] }: { query: string; values?: any[] }): Promise<T> {
  try {
    console.log("Executing query:", query, "with values:", values)
    const [results] = await pool.execute(query, values)
    return results as T
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error(`Database query failed: ${error.message}`)
  }
}

// Helper function to get a single row
export async function getRow<T>({ query, values = [] }: { query: string; values?: any[] }): Promise<T | null> {
  try {
    const results = await executeQuery<T[]>({ query, values })
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error(`Database query failed: ${error.message}`)
  }
}

// Helper function to insert a row and return the inserted ID
export async function insertRow({ table, data }: { table: string; data: Record<string, any> }): Promise<number> {
  try {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => "?").join(", ")

    console.log("Inserting into table:", table)
    console.log("Data:", data)

    const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`
    console.log("Insert query:", query)
    console.log("Values:", values)

    const [result] = await pool.execute(query, values)

    return (result as any).insertId
  } catch (error) {
    console.error("Database insert error:", error)
    throw new Error(`Database insert failed: ${error.message}`)
  }
}

// Helper function to update a row
export async function updateRow({
  table,
  data,
  whereClause,
  whereValues = [],
}: {
  table: string
  data: Record<string, any>
  whereClause: string
  whereValues?: any[]
}): Promise<boolean> {
  try {
    const keys = Object.keys(data)
    const values = Object.values(data)

    const setClause = keys.map((key) => `${key} = ?`).join(", ")
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`

    const [result] = await pool.execute(query, [...values, ...whereValues])

    return (result as any).affectedRows > 0
  } catch (error) {
    console.error("Database update error:", error)
    throw new Error(`Database update failed: ${error.message}`)
  }
}

// Helper function to delete a row
export async function deleteRow({
  table,
  whereClause,
  whereValues = [],
}: {
  table: string
  whereClause: string
  whereValues?: any[]
}): Promise<boolean> {
  try {
    const query = `DELETE FROM ${table} WHERE ${whereClause}`
    const [result] = await pool.execute(query, whereValues)

    return (result as any).affectedRows > 0
  } catch (error) {
    console.error("Database delete error:", error)
    throw new Error(`Database delete failed: ${error.message}`)
  }
}
