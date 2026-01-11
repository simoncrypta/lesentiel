import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { getReceiptsDir, ensureReceiptsDir, moveFileToReceipts } from "./receipts.ts";
import { join } from "path";
import { homedir } from "os";

describe("receipts", () => {
  const testReceiptsDir = join("/tmp", "test-receipts");
  let originalGetReceiptsDir: () => string;

  beforeEach(async () => {
    // Mock getReceiptsDir to use test directory
    originalGetReceiptsDir = getReceiptsDir;
    
    // Clean up test directory
    try {
      await Bun.spawn(["rm", "-rf", testReceiptsDir]).exited;
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Cleanup
    try {
      await Bun.spawn(["rm", "-rf", testReceiptsDir]).exited;
    } catch {
      // Ignore errors
    }
  });

  describe("getReceiptsDir", () => {
    it("should return receipts directory path in home directory", () => {
      const dir = getReceiptsDir();
      expect(dir).toBe(join(homedir(), "receipts"));
    });
  });

  describe("ensureReceiptsDir", () => {
    it("should create receipts directory if it doesn't exist", async () => {
      // Use actual receipts dir for this test
      await ensureReceiptsDir();
      
      const dir = getReceiptsDir();
      // Check if directory exists by checking for .keep file
      const keepFile = Bun.file(join(dir, ".keep"));
      expect(await keepFile.exists()).toBe(true);
    });

    it("should not throw if directory already exists", async () => {
      await ensureReceiptsDir();
      // Second call should not throw
      let error;
      try {
        await ensureReceiptsDir();
      } catch (e) {
        error = e;
      }
      expect(error).toBeUndefined();
    });
  });

  describe("moveFileToReceipts", () => {
    beforeEach(async () => {
      // Ensure receipts directory exists for these tests
      await ensureReceiptsDir();
    });

    it("should move a file to receipts directory", async () => {
      // Create source file
      const sourceFile = "/tmp/test-receipt.txt";
      await Bun.write(sourceFile, "test content");

      const filename = await moveFileToReceipts(sourceFile);
      
      expect(filename).toBe("test-receipt.txt");
      
      // Check destination exists
      const destPath = join(getReceiptsDir(), filename);
      const destFile = Bun.file(destPath);
      expect(await destFile.exists()).toBe(true);
      expect(await destFile.text()).toBe("test content");
      
      // Check source was deleted
      const sourceFileHandle = Bun.file(sourceFile);
      expect(await sourceFileHandle.exists()).toBe(false);
      
      // Cleanup
      await Bun.spawn(["rm", destPath]).exited;
    });

    it("should throw error if source file doesn't exist", async () => {
      await expect(
        moveFileToReceipts("/nonexistent/file.txt")
      ).rejects.toThrow("Source file does not exist");
    });

    it("should throw error if destination file already exists", async () => {
      const sourceFile = "/tmp/duplicate.txt";
      await Bun.write(sourceFile, "content");
      
      const destPath = join(getReceiptsDir(), "duplicate.txt");
      await Bun.write(destPath, "existing");

      await expect(
        moveFileToReceipts(sourceFile)
      ).rejects.toThrow("File already exists in receipts");
      
      // Cleanup
      await Bun.spawn(["rm", sourceFile]).exited;
      await Bun.spawn(["rm", destPath]).exited;
    });

    it("should handle files with spaces in name", async () => {
      const sourceFile = "/tmp/file with spaces.pdf";
      await Bun.write(sourceFile, "pdf content");

      const filename = await moveFileToReceipts(sourceFile);
      
      expect(filename).toBe("file with spaces.pdf");
      
      const destPath = join(getReceiptsDir(), filename);
      const destFile = Bun.file(destPath);
      expect(await destFile.exists()).toBe(true);
      
      // Cleanup
      await Bun.spawn(["rm", destPath]).exited;
    });

    it("should handle files with special characters", async () => {
      const sourceFile = "/tmp/receipt-2024_01.pdf";
      await Bun.write(sourceFile, "content");

      const filename = await moveFileToReceipts(sourceFile);
      
      expect(filename).toBe("receipt-2024_01.pdf");
      
      // Cleanup
      const destPath = join(getReceiptsDir(), filename);
      await Bun.spawn(["rm", destPath]).exited;
    });

    it("should preserve file content when moving", async () => {
      const content = "Important receipt data\nLine 2\nLine 3";
      const sourceFile = "/tmp/content-test.txt";
      await Bun.write(sourceFile, content);

      const filename = await moveFileToReceipts(sourceFile);
      
      const destPath = join(getReceiptsDir(), filename);
      const destFile = Bun.file(destPath);
      expect(await destFile.text()).toBe(content);
      
      // Cleanup
      await Bun.spawn(["rm", destPath]).exited;
    });
  });
});
