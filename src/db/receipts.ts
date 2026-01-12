import { getDatabase } from "./index.ts";

export interface Receipt {
  id?: number;
  filename: string;
  merchant_name?: string;
  receipt_date?: string;
  total_amount?: number;
  currency?: string;
  raw_text?: string;
  processed_at?: string;
  processing_status?: string;
}

export interface ReceiptWithItems extends Receipt {
  items: ReceiptItem[];
}

export interface ReceiptItem {
  id?: number;
  receipt_id?: number;
  item_name: string;
  quantity?: number;
  unit_price?: number;
  total_price: number;
  category?: string;
}

/**
 * Insert a new receipt and return the inserted record
 * Uses prepared statement with RETURNING clause
 */
export function insertReceipt(receipt: Receipt): Receipt {
  const db = getDatabase();
  
  const stmt = db.query<Receipt, {
    filename: string;
    merchant_name: string | null;
    receipt_date: string | null;
    total_amount: number | null;
    currency: string;
    raw_text: string | null;
    processing_status: string;
  }>(`
    INSERT INTO receipts (
      filename, merchant_name, receipt_date, total_amount, 
      currency, raw_text, processing_status
    )
    VALUES (
      $filename, $merchant_name, $receipt_date, $total_amount,
      $currency, $raw_text, $processing_status
    )
    RETURNING *
  `);
  
  const result = stmt.get({
    filename: receipt.filename,
    merchant_name: receipt.merchant_name || null,
    receipt_date: receipt.receipt_date || null,
    total_amount: receipt.total_amount || null,
    currency: receipt.currency || "USD",
    raw_text: receipt.raw_text || null,
    processing_status: receipt.processing_status || "pending",
  });
  
  if (!result) {
    throw new Error("Failed to insert receipt");
  }
  
  return result;
}

/**
 * Get a receipt by ID with its items
 */
export function getReceiptWithItems(id: number): ReceiptWithItems | null {
  const db = getDatabase();
  
  // Get receipt
  const receiptStmt = db.query<Receipt, { id: number }>(`
    SELECT * FROM receipts WHERE id = $id
  `);
  
  const receipt = receiptStmt.get({ id: id });
  
  if (!receipt) {
    return null;
  }
  
  // Get items
  const itemsStmt = db.query<ReceiptItem, { receipt_id: number }>(`
    SELECT * FROM receipt_items WHERE receipt_id = $receipt_id
  `);
  
  const items = itemsStmt.all({ receipt_id: id });
  
  return {
    ...receipt,
    items,
  };
}

/**
 * Get a receipt by filename
 */
export function getReceiptByFilename(filename: string): Receipt | null {
  const db = getDatabase();
  
  const stmt = db.query<Receipt, { filename: string }>(`
    SELECT * FROM receipts WHERE filename = $filename
  `);
  
  return stmt.get({ filename: filename }) || null;
}

/**
 * Get all receipts with summary (no items)
 */
export function getAllReceipts(): Receipt[] {
  const db = getDatabase();
  
  const stmt = db.query<Receipt, []>(`
    SELECT * FROM receipts ORDER BY processed_at DESC
  `);
  
  return stmt.all();
}

/**
 * Update receipt status
 */
export function updateReceiptStatus(
  id: number,
  status: string
): { changes: number } {
  const db = getDatabase();
  
  const stmt = db.query<never, { id: number; status: string }>(`
    UPDATE receipts SET processing_status = $status WHERE id = $id
  `);
  
  return stmt.run({ id: id, status: status });
}

/**
 * Delete a receipt (cascade deletes items)
 */
export function deleteReceipt(id: number): { changes: number } {
  const db = getDatabase();
  
  const stmt = db.query<never, { id: number }>(`
    DELETE FROM receipts WHERE id = $id
  `);
  
  return stmt.run({ id: id });
}
