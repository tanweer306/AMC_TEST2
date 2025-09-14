import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function POST() {
  try {
    console.log("🔄 Setting up database tables...");

    // Create customers table
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          -- Personal Information
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(20) NOT NULL,
          years_experience VARCHAR(20) NOT NULL,
          
          -- Professional Information
          company_name VARCHAR(255) NOT NULL,
          license_number VARCHAR(100) NOT NULL,
          license_state VARCHAR(2) NOT NULL,
          designations TEXT[], -- Array of designations like MAI, SRA, ASA
          specialties TEXT[], -- Array of property type specialties
          fha_roster VARCHAR(50),
          va_panel VARCHAR(50),
          
          -- Address Information
          address1 VARCHAR(255) NOT NULL,
          address2 VARCHAR(255),
          city VARCHAR(100) NOT NULL,
          state VARCHAR(2) NOT NULL,
          zip VARCHAR(10) NOT NULL,
          service_radius VARCHAR(20),
          travel_willingness VARCHAR(50),
          coverage_area TEXT,
          
          -- Business Information
          business_type VARCHAR(100) NOT NULL,
          languages TEXT[], -- Array of languages spoken
          geographic_coverage TEXT[], -- Array of geographic coverage types
          tax_id VARCHAR(20) NOT NULL,
          formation_date DATE NOT NULL,
          current_amc_relationships TEXT,
          
          -- Terms & Privacy
          terms_accepted BOOLEAN DEFAULT FALSE,
          privacy_accepted BOOLEAN DEFAULT FALSE,
          
          -- Metadata
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customer_documents table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_documents (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          document_type VARCHAR(50) NOT NULL, -- license, eoInsurance, resume, etc.
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500), -- For storing actual file path if needed
          file_size INTEGER, -- File size in bytes
          mime_type VARCHAR(100), -- File MIME type
          is_required BOOLEAN DEFAULT FALSE,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(customer_id, document_type)
      )
    `);

    // Create customer_selected_companies table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_selected_companies (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          amc_company_id VARCHAR(50) NOT NULL, -- References amc_companies.id
          selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(customer_id, amc_company_id)
      )
    `);

    // Create customer_references table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_references (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          reference_order INTEGER NOT NULL, -- 1, 2, or 3
          name VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          relationship VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(customer_id, reference_order)
      )
    `);

    // Create indexes
    await query(
      `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON customer_documents(customer_id)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_customer_selected_companies_customer_id ON customer_selected_companies(customer_id)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_customer_references_customer_id ON customer_references(customer_id)`
    );

    console.log("✅ Database tables created successfully!");

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully",
      tables: [
      "customers",
      "customer_documents",
      "customer_selected_companies",
      "customer_references"]

    });
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to setup database",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}