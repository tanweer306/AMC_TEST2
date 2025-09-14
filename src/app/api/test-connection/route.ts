import { NextResponse } from "next/server";
import { testConnection } from "@/lib/database";

export async function GET() {
  try {
    console.log("🧪 API endpoint called: /api/test-connection");

    const result = await testConnection();

    return NextResponse.json({
      success: result.success,
      message: result.success ?
      "Database connection successful!" :
      "Database connection failed",
      data: result.success ? result.data : undefined,
      error: !result.success ? result.error : undefined,
      environment: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
      }
    });
  } catch (error) {
    console.error("❌ Test connection API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "API error during connection test",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}