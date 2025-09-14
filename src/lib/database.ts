import { Pool } from "pg";

// Create a single connection pool that will be reused
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      ssl:
      process.env.DB_SSL_REJECT_UNAUTHORIZED === "false" ?
      { rejectUnauthorized: false } :
      false,
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "10000"
      ),
      max: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
      idleTimeoutMillis: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
      // Reset pool on error
      pool = null;
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const client = getPool();
  try {
    console.log("🔄 Executing query:", text.substring(0, 100) + "...");
    const result = await client.query(text, params || []);
    console.log("✅ Query successful, rows:", result.rowCount);
    return { rows: result.rows, rowCount: result.rowCount || 0 };
  } catch (error) {
    console.error("❌ Database query error:", error);

    // If connection error, reset pool for next request
    if (
    error instanceof Error && (
    error.message.includes("CONNECTION_CLOSED") ||
    error.message.includes("ECONNRESET")))
    {
      console.log("🔄 Resetting connection pool...");
      pool = null;
    }

    throw error;
  }
}

// Test connection function
export async function testConnection() {
  try {
    console.log("🧪 Testing database connection...");
    const result = await query(
      "SELECT NOW() as current_time, version() as version"
    );
    console.log("✅ Connection test successful");
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Close pool on process exit
process.on("exit", () => {
  if (pool) {
    pool.end();
  }
});

process.on("SIGINT", () => {
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (pool) {
    pool.end();
  }
  process.exit(0);
});