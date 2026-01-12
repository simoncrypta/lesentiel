import { join } from "path";
import { getReceiptsDir } from "./receipts.ts";
import {
  loadPDFDocuments,
  extractRawText,
  assessTextQuality,
  convertPDFToBase64,
  getPDFMetadata,
} from "./pdfProcessor.ts";
import {
  extractReceiptData,
  extractReceiptDataWithVision,
  validateReceiptData,
  type ExtractedReceiptData,
} from "./llmProcessor.ts";
import { insertReceipt, getReceiptByFilename } from "../db/receipts.ts";
import { insertReceiptItems } from "../db/items.ts";
import { getDatabase } from "../db/index.ts";

export interface ProcessingResult {
  success: boolean;
  filename: string;
  receiptId?: number;
  message: string;
  usedVision: boolean;
  textQuality?: number;
  extractedData?: ExtractedReceiptData;
  validationIssues?: string[];
}

const QUALITY_THRESHOLD = 80; // Use vision if quality < 80%
const ENABLE_VISION_FALLBACK =
  process.env["ENABLE_VISION_FALLBACK"] !== "false"; // Default true

/**
 * Process a receipt PDF through the full pipeline:
 * 1. Verify PDF exists
 * 2. Use OpenAI vision API to extract text and data
 * 3. Extract structured data with LLM
 * 4. Validate and store in database
 */
export async function processReceipt(
  filename: string
): Promise<ProcessingResult> {
  const receiptsDir = getReceiptsDir();
  const pdfPath = join(receiptsDir, filename);

  try {
    // Check if already processed
    const existing = getReceiptByFilename(filename);
    if (existing) {
      return {
        success: false,
        filename,
        receiptId: existing.id,
        message: "Receipt already processed",
        usedVision: false,
      };
    }

    // Step 1: Verify PDF exists
    console.log(`Loading PDF: ${filename}`);
    const docs = await loadPDFDocuments(pdfPath);
    
    if (docs.length === 0) {
      throw new Error("No content found in PDF");
    }

    // Step 2: Always use vision API for PDF processing
    // Text extraction from PDFs is unreliable in Bun environment
    console.log("Using vision API for PDF processing...");
    const pdfBase64 = await convertPDFToBase64(pdfPath);
    const extractedData = await extractReceiptDataWithVision(pdfBase64, "");
    const usedVision = true;

    console.log(
      `Extracted: ${extractedData.merchant_name}, ${extractedData.items.length} items`
    );

    // Step 3: Validate extracted data
    const validation = validateReceiptData(extractedData);
    if (!validation.valid) {
      console.warn("Validation issues:", validation.issues);
    }

    // Step 4: Store in database (with transaction for atomicity)
    const db = getDatabase();
    const insertTransaction = db.transaction(() => {
      // Insert receipt
      const receipt = insertReceipt({
        filename,
        merchant_name: extractedData.merchant_name,
        receipt_date: extractedData.receipt_date,
        total_amount: extractedData.total_amount,
        currency: extractedData.currency,
        raw_text: "", // No raw text available with vision-only approach
        processing_status: validation.valid ? "complete" : "needs_review",
      });

      if (!receipt.id) {
        throw new Error("Failed to insert receipt");
      }

      // Insert items
      if (extractedData.items.length > 0) {
        insertReceiptItems(receipt.id, extractedData.items);
      }

      return receipt.id;
    });

    const receiptId = insertTransaction();

    return {
      success: true,
      filename,
      receiptId,
      message: validation.valid
        ? "Receipt processed successfully"
        : "Receipt processed with validation issues",
      usedVision,
      extractedData,
      validationIssues: validation.issues,
    };
  } catch (error) {
    console.error(`Failed to process ${filename}:`, error);

    // Don't save failed receipts to database
    // This allows users to retry processing without manual cleanup

    return {
      success: false,
      filename,
      message:
        error instanceof Error ? error.message : "Unknown processing error",
      usedVision: false,
    };
  }
}

/**
 * Process multiple receipts in sequence
 */
export async function processMultipleReceipts(
  filenames: string[]
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (const filename of filenames) {
    const result = await processReceipt(filename);
    results.push(result);
  }

  return results;
}

/**
 * Get all unprocessed PDFs in receipts directory
 */
export async function getUnprocessedReceipts(): Promise<string[]> {
  const receiptsDir = getReceiptsDir();
  const glob = new Bun.Glob("*.pdf");
  const allPdfs = await Array.fromAsync(glob.scan(receiptsDir));
  
  // Filter out already processed files
  const unprocessed = allPdfs.filter((filename) => {
    const existing = getReceiptByFilename(filename);
    return !existing || existing.processing_status === "error";
  });

  return unprocessed;
}
