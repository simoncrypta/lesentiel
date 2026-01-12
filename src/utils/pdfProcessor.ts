import type { Document } from "@langchain/core/documents";

/**
 * Load PDF as LangChain Document objects
 * Since text extraction from PDFs is unreliable in Bun, this returns
 * minimal metadata - actual text extraction will be done via OpenAI vision
 */
export async function loadPDFDocuments(pdfPath: string): Promise<Document[]> {
  const file = Bun.file(pdfPath);
  const exists = await file.exists();
  
  if (!exists) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }
  
  // Return a placeholder document - text extraction happens via vision
  const doc: Document = {
    pageContent: "[PDF content - will be extracted via vision]",
    metadata: {
      source: pdfPath,
      totalPages: 1, // We don't know page count without parsing
    },
  };
  
  return [doc];
}

/**
 * Convert PDF to base64-encoded string for vision API
 */
export async function convertPDFToBase64(pdfPath: string): Promise<string> {
  const file = Bun.file(pdfPath);
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}
