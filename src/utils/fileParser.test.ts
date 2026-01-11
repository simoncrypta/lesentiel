import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { parseFilePaths, looksLikeFilePath } from "./fileParser.ts";
import { join } from "path";

describe("fileParser", () => {
  let testFiles: string[] = [];

  beforeEach(async () => {
    // Create test files
    const testDir = "/tmp/receipt-test";
    await Bun.write(join(testDir, "test1.txt"), "test content 1");
    await Bun.write(join(testDir, "test2.pdf"), "test content 2");
    await Bun.write(join(testDir, "file with spaces.txt"), "test content 3");
    
    testFiles = [
      join(testDir, "test1.txt"),
      join(testDir, "test2.pdf"),
      join(testDir, "file with spaces.txt"),
    ];
  });

  afterEach(async () => {
    // Cleanup test files
    for (const file of testFiles) {
      try {
        await Bun.spawn(["rm", file]).exited;
      } catch {
        // Ignore errors
      }
    }
  });

  describe("parseFilePaths", () => {
    it("should parse a single file path", async () => {
      const result = await parseFilePaths(testFiles[0]!);
      expect(result).toEqual([testFiles[0]]);
    });

    it("should parse multiple newline-separated file paths", async () => {
      const input = testFiles.join("\n");
      const result = await parseFilePaths(input);
      expect(result).toEqual(testFiles);
    });

    it("should handle quoted paths", async () => {
      const input = `"${testFiles[2]}"`;
      const result = await parseFilePaths(input);
      expect(result).toEqual([testFiles[2]]);
    });

    it("should handle escaped spaces", async () => {
      const escapedPath = testFiles[2]!.replace(/ /g, "\\ ");
      const result = await parseFilePaths(escapedPath);
      expect(result).toEqual([testFiles[2]]);
    });

    it("should handle file:// URLs", async () => {
      const fileUrl = `file://${testFiles[0]}`;
      const result = await parseFilePaths(fileUrl);
      expect(result).toEqual([testFiles[0]]);
    });

    it("should filter out non-existent paths", async () => {
      const input = `${testFiles[0]}\n/nonexistent/file.txt\n${testFiles[1]}`;
      const result = await parseFilePaths(input);
      expect(result).toEqual([testFiles[0], testFiles[1]]);
    });

    it("should return empty array for empty input", async () => {
      const result = await parseFilePaths("");
      expect(result).toEqual([]);
    });

    it("should return empty array for whitespace-only input", async () => {
      const result = await parseFilePaths("   \n  \t  ");
      expect(result).toEqual([]);
    });

    it("should handle mixed valid and invalid paths", async () => {
      const input = `${testFiles[0]}\ninvalid-path\n${testFiles[1]}\n/another/invalid.txt`;
      const result = await parseFilePaths(input);
      expect(result).toEqual([testFiles[0], testFiles[1]]);
    });
  });

  describe("looksLikeFilePath", () => {
    it("should recognize absolute paths", () => {
      expect(looksLikeFilePath("/tmp/file.txt")).toBe(true);
      expect(looksLikeFilePath("/Users/test/document.pdf")).toBe(true);
    });

    it("should recognize relative paths", () => {
      expect(looksLikeFilePath("./file.txt")).toBe(true);
      expect(looksLikeFilePath("../parent/file.txt")).toBe(true);
    });

    it("should recognize file:// URLs", () => {
      expect(looksLikeFilePath("file:///tmp/file.txt")).toBe(true);
    });

    it("should reject non-path strings", () => {
      expect(looksLikeFilePath("just some text")).toBe(false);
      expect(looksLikeFilePath("filename.txt")).toBe(false);
      expect(looksLikeFilePath("")).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(looksLikeFilePath("  /tmp/file.txt  ")).toBe(true);
      expect(looksLikeFilePath("   ")).toBe(false);
    });
  });
});
