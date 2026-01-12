import { getDatabase } from "./index.ts";
import type { ReceiptItem } from "./receipts.ts";

/**
 * Insert multiple receipt items in a transaction
 * Returns array of inserted items with IDs
 */
export function insertReceiptItems(
  receiptId: number,
  items: Omit<ReceiptItem, "id" | "receipt_id">[]
): ReceiptItem[] {
  const db = getDatabase();
  
  const insertFn = db.transaction((itemsToInsert: typeof items) => {
    const stmt = db.query<ReceiptItem, {
      receipt_id: number;
      item_name: string;
      quantity: number;
      unit_price: number | null;
      total_price: number;
      category: string | null;
    }>(`
      INSERT INTO receipt_items (
        receipt_id, item_name, quantity, unit_price, total_price, category
      )
      VALUES (
        $receipt_id, $item_name, $quantity, $unit_price, $total_price, $category
      )
      RETURNING *
    `);
    
    const results: ReceiptItem[] = [];
    
    for (const item of itemsToInsert) {
      const result = stmt.get({
        receipt_id: receiptId,
        item_name: item.item_name,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || null,
        total_price: item.total_price,
        category: item.category || null,
      });
      
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  });
  
  return insertFn(items);
}

/**
 * Get all items for a receipt
 */
export function getReceiptItems(receiptId: number): ReceiptItem[] {
  const db = getDatabase();
  
  const stmt = db.query<ReceiptItem, { receipt_id: number }>(`
    SELECT * FROM receipt_items WHERE receipt_id = $receipt_id ORDER BY id
  `);
  
  return stmt.all({ receipt_id: receiptId });
}

/**
 * Delete all items for a receipt
 */
export function deleteReceiptItems(receiptId: number): { changes: number } {
  const db = getDatabase();
  
  const stmt = db.query<never, { receipt_id: number }>(`
    DELETE FROM receipt_items WHERE receipt_id = $receipt_id
  `);
  
  return stmt.run({ receipt_id: receiptId });
}
