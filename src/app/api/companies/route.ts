import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { AMCCompany } from "@/types";

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Fetching companies from database...");

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12"); // 12 companies per page
    const offset = (page - 1) * limit;

    console.log(`📄 Loading page ${page}, limit ${limit}, offset ${offset}`);

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM amc_companies`
    );
    const totalCount = parseInt(countResult.rows[0]?.total || "0");

    // Query to fetch companies with pagination
    const result = await query(
      `
      SELECT 
        id,
        name,
        phone,
        email,
        state,
        website,
        signup_url
      FROM amc_companies 
      ORDER BY name ASC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    console.log(
      `✅ Found ${result.rowCount} companies (page ${page} of ${Math.ceil(totalCount / limit)})`
    );

    // Transform the data to match our AMCCompany type
    const companies: AMCCompany[] = result.rows.map((row: any) => ({
      id: row.id.toString(), // Convert to string to match our type
      name: row.name || "",
      phone: row.phone || "",
      email: row.email || "",
      state: row.state || "",
      website: row.website || "",
      signupUrl: row.signup_url || "" // Note: using snake_case from DB
    }));

    return NextResponse.json(
      {
        companies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount: totalCount,
          hasMore: page < Math.ceil(totalCount / limit),
          limit: limit
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching companies:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch companies",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}