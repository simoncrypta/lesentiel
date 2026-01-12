import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { initDatabase, getDatabase, closeDatabase } from "./index.ts";
import { insertReceipt, getAllReceipts, getReceiptByFilename } from "./receipts.ts";
import { insertReceiptItems, getReceiptItems } from "./items.ts";

describe("Database", () => {
  beforeEach(() => {
    // Use in-memory database for tests
    process.env["DATABASE_PATH"] = ":memory:";
    initDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  it("should initialize database with tables", () => {
    const db = getDatabase();
    
    // Check if tables exist
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map((t: any) => t.name);
    
    expect(tableNames).toContain("receipts");
    expect(tableNames).toContain("receipt_items");
  });

  it("should insert and retrieve a receipt", () => {
    const receipt = insertReceipt({
      filename: "test.pdf",
      merchant_name: "Test Store",
      receipt_date: "2024-01-12",
      total_amount: 99.99,
      currency: "USD",
      processing_status: "complete",
    });

    expect(receipt.id).toBeDefined();
    expect(receipt.filename).toBe("test.pdf");
    expect(receipt.merchant_name).toBe("Test Store");
    
    // Retrieve by filename
    const retrieved = getReceiptByFilename("test.pdf");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.merchant_name).toBe("Test Store");
  });

  it("should insert receipt items in transaction", () => {
    const receipt = insertReceipt({
      filename: "test-items.pdf",
      merchant_name: "Test Store",
      total_amount: 25.50,
    });

    const items = insertReceiptItems(receipt.id!, [
      { item_name: "Coffee", total_price: 5.50, quantity: 2 },
      { item_name: "Bagel", total_price: 3.00 },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]?.item_name).toBe("Coffee");
    expect(items[1]?.item_name).toBe("Bagel");
    
    // Retrieve items
    const retrieved = getReceiptItems(receipt.id!);
    expect(retrieved).toHaveLength(2);
  });

  it("should get all receipts", () => {
    insertReceipt({ filename: "receipt1.pdf", total_amount: 10 });
    insertReceipt({ filename: "receipt2.pdf", total_amount: 20 });
    
    const all = getAllReceipts();
    expect(all).toHaveLength(2);
  });

  it("should enforce unique filename constraint", () => {
    insertReceipt({ filename: "unique.pdf", total_amount: 10 });
    
    expect(() => {
      insertReceipt({ filename: "unique.pdf", total_amount: 20 });
    }).toThrow();
  });

  it("should use prepared statements (cached queries)", () => {
    const db = getDatabase();
    
    // First call should cache the statement
    const stmt1 = db.query("SELECT * FROM receipts WHERE filename = $filename");
    
    // Second call should return the same cached statement
    const stmt2 = db.query("SELECT * FROM receipts WHERE filename = $filename");
    
    // In Bun SQLite, .query() returns cached statements
    expect(stmt1).toBe(stmt2);
  });
});
