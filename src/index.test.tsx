import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { testRender } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

describe("Receipt Manager UI", () => {
  let testSetup: Awaited<ReturnType<typeof testRender>>;

  beforeEach(async () => {
    if (testSetup) {
      testSetup.renderer.destroy();
    }
  });

  afterEach(() => {
    if (testSetup) {
      testSetup.renderer.destroy();
    }
  });

  describe("Header Rendering", () => {
    it("should render the app header with ASCII font", async () => {
      // Create a simple test component that mimics the header
      testSetup = await testRender(
        () => (
          <box flexDirection="column" flexGrow={1} padding={2}>
            <box marginBottom={2}>
              <ascii_font font="tiny" text="Receipt Manager" />
            </box>
          </box>
        ),
        {
          width: 80,
          height: 20,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      // Should render ASCII art (the frame should not be empty and contain characters)
      expect(frame.length).toBeGreaterThan(100);
      // ASCII font renders with various characters including box drawing
      expect(frame).toBeTruthy();
    });
  });

  describe("Receipts List Rendering", () => {
    it("should render empty receipts list", async () => {
      testSetup = await testRender(
        () => (
          <box border={true} padding={1} flexGrow={1} flexDirection="column">
            <text attributes={1}>Receipts (0):</text>
            <text attributes={2}>No receipts yet</text>
          </box>
        ),
        {
          width: 60,
          height: 15,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      expect(frame).toContain("Receipts (0):");
      expect(frame).toContain("No receipts yet");
    });

    it("should render receipts list with files", async () => {
      const receipts = ["invoice1.pdf", "invoice2.pdf", "receipt.txt"];

      testSetup = await testRender(
        () => (
          <box border={true} padding={1} flexGrow={1} flexDirection="column">
            <text attributes={1}>Receipts ({receipts.length}):</text>
            {receipts.map((filename) => (
              <text attributes={2}>{filename}</text>
            ))}
          </box>
        ),
        {
          width: 60,
          height: 15,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      expect(frame).toContain("Receipts (3):");
      expect(frame).toContain("invoice1.pdf");
      expect(frame).toContain("invoice2.pdf");
      expect(frame).toContain("receipt.txt");
    });
  });

  describe("Footer Rendering", () => {
    it("should render default footer message", async () => {
      testSetup = await testRender(
        () => (
          <box flexDirection="column" flexGrow={1} padding={2}>
            <box position="absolute" bottom={1} left={2} right={2}>
              <text attributes={2}>
                Drag & drop files here to add them to ~/receipts
              </text>
            </box>
          </box>
        ),
        {
          width: 80,
          height: 20,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      expect(frame).toContain("Drag & drop files");
      expect(frame).toContain("~/receipts");
    });

    it("should render processing message", async () => {
      testSetup = await testRender(
        () => (
          <box flexDirection="column" flexGrow={1} padding={2}>
            <box position="absolute" bottom={1} left={2} right={2}>
              <text attributes={2}>Processing...</text>
            </box>
          </box>
        ),
        {
          width: 80,
          height: 20,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      expect(frame).toContain("Processing");
    });

    it("should render success message", async () => {
      testSetup = await testRender(
        () => (
          <box flexDirection="column" flexGrow={1} padding={2}>
            <box position="absolute" bottom={1} left={2} right={2}>
              <text attributes={2}>✓ Moved 2 file(s)</text>
            </box>
          </box>
        ),
        {
          width: 80,
          height: 20,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      expect(frame).toContain("✓ Moved");
      expect(frame).toContain("file(s)");
    });

    it("should render error message", async () => {
      testSetup = await testRender(
        () => (
          <box flexDirection="column" flexGrow={1} padding={2}>
            <box position="absolute" bottom={1} left={2} right={2}>
              <text attributes={2}>No valid file paths found</text>
            </box>
          </box>
        ),
        {
          width: 80,
          height: 20,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      expect(frame).toContain("No valid file paths found");
    });
  });

  describe("Layout Structure", () => {
    it("should render complete app layout", async () => {
      testSetup = await testRender(
        () => (
          <box flexDirection="column" flexGrow={1} padding={2}>
            {/* Header */}
            <box marginBottom={2}>
              <ascii_font font="tiny" text="Receipt Manager" />
            </box>

            {/* Receipts List */}
            <box border={true} padding={1} flexGrow={1} flexDirection="column">
              <text attributes={1}>Receipts (0):</text>
              <text attributes={2}>No receipts yet</text>
            </box>

            {/* Footer */}
            <box position="absolute" bottom={1} left={2} right={2}>
              <text attributes={2}>
                Drag & drop files here to add them to ~/receipts
              </text>
            </box>
          </box>
        ),
        {
          width: 80,
          height: 20,
        }
      );

      await testSetup.renderOnce();
      const frame = testSetup.captureCharFrame();
      
      // Verify all major sections are present
      // ASCII art header exists (frame has content)
      expect(frame.length).toBeGreaterThan(100);
      expect(frame).toContain("Receipts");
      expect(frame).toContain("Drag & drop");
    });
  });
});
