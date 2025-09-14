import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("🔄 Starting registration save process...");

    // Start transaction
    await query("BEGIN");

    try {
      console.log("📝 Inserting customer data...");

      // Insert customer data
      const customerResult = await query(
        `
        INSERT INTO customers (
          first_name, last_name, email, phone, years_experience,
          company_name, license_number, license_state, designations, specialties, fha_roster, va_panel,
          address1, address2, city, state, zip, service_radius, travel_willingness, coverage_area,
          business_type, languages, geographic_coverage, tax_id, formation_date, current_amc_relationships,
          terms_accepted, privacy_accepted
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26,
          $27, $28
        ) RETURNING id
      `,
        [
        data.firstName || "",
        data.lastName || "",
        data.regEmail || "",
        data.regPhone || "",
        data.yearsExperience || "",
        data.companyName || "",
        data.licenseNumber || "",
        data.licenseState || "",
        data.designations || [],
        data.specialties || [],
        data.fhaRoster || "",
        data.vaPanel || "",
        data.address1 || "",
        data.address2 || "",
        data.city || "",
        data.state || "",
        data.zip || "",
        data.serviceRadius || "",
        data.travelWillingness || "",
        data.coverageArea || "",
        data.businessType || "",
        data.languages || [],
        data.geographicCoverage || [],
        data.taxId || "",
        data.formationDate || "",
        data.currentAmcRelationships || "",
        data.termsAccepted || false,
        data.privacyAccepted || false]

      );

      const customerId = customerResult.rows[0].id;
      console.log(`✅ Customer created with ID: ${customerId}`);

      // Insert selected companies
      console.log("🏢 Saving selected companies...");
      if (data.selectedCompanyIds && data.selectedCompanyIds.length > 0) {
        for (const companyId of data.selectedCompanyIds) {
          await query(
            `
            INSERT INTO customer_selected_companies (customer_id, amc_company_id)
            VALUES ($1, $2)
            ON CONFLICT (customer_id, amc_company_id) DO NOTHING
          `,
            [customerId, companyId]
          );
        }
        console.log(
          `✅ Saved ${data.selectedCompanyIds.length} selected companies`
        );
      }

      // Insert references
      console.log("👥 Saving professional references...");
      if (data.references && data.references.length > 0) {
        for (let i = 0; i < data.references.length; i++) {
          const ref = data.references[i];
          if (
          ref &&
          ref.name &&
          ref.company &&
          ref.email &&
          ref.phone &&
          ref.relationship)
          {
            await query(
              `
              INSERT INTO customer_references (customer_id, reference_order, name, company, email, phone, relationship)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
              [
              customerId,
              i + 1,
              ref.name,
              ref.company,
              ref.email,
              ref.phone,
              ref.relationship]

            );
          }
        }
        console.log(`✅ Saved references`);
      }

      // Insert documents (file names)
      console.log("📄 Saving document information...");
      if (data.documents) {
        const documentTypes = [
        { key: "license", required: true },
        { key: "eoInsurance", required: true },
        { key: "resume", required: true },
        { key: "sampleReport", required: true },
        { key: "w9", required: true },
        { key: "directDeposit", required: false },
        { key: "techCompliance", required: false },
        { key: "liability", required: false },
        { key: "businessLicense", required: false }];


        let documentsCount = 0;
        for (const docType of documentTypes) {
          const document = data.documents[docType.key];
          if (document) {
            let fileName = "";
            let fileSize = 0;
            let mimeType = "";

            if (typeof document === "object" && document.name) {
              fileName = document.name;
              fileSize = document.size || 0;
              mimeType = document.type || "";
            } else if (typeof document === "string") {
              fileName = document;
            }

            if (fileName) {
              await query(
                `
                INSERT INTO customer_documents (customer_id, document_type, file_name, file_size, mime_type, is_required)
                VALUES ($1, $2, $3, $4, $5, $6)
              `,
                [
                customerId,
                docType.key,
                fileName,
                fileSize,
                mimeType,
                docType.required]

              );
              documentsCount++;
            }
          }
        }
        console.log(`✅ Saved ${documentsCount} documents`);
      }

      // Commit transaction
      await query("COMMIT");
      console.log("🎉 Registration save completed successfully!");

      return NextResponse.json({
        success: true,
        message: "Registration completed successfully",
        customerId: customerId
      });
    } catch (error) {
      await query("ROLLBACK");
      console.log("❌ Rolling back transaction");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error saving registration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save registration",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}