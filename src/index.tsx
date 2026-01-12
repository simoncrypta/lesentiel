import { TextAttributes } from "@opentui/core";
import { render, usePaste, useKeyboard, useRenderer } from "@opentui/solid";
import { createSignal, onMount, For, createEffect } from "solid-js";
import { ensureReceiptsDir, moveFileToReceipts, getReceiptsDir } from "./utils/receipts.ts";
import { parseFilePaths } from "./utils/fileParser.ts";
import { initDatabase } from "./db/index.ts";
import { getAllReceipts, type Receipt } from "./db/receipts.ts";
import { processReceipt } from "./utils/receiptProcessor.ts";

function App() {
  const renderer = useRenderer();
  const [files, setFiles] = createSignal<string[]>([]);
  const [processedReceipts, setProcessedReceipts] = createSignal<Receipt[]>([]);
  const [footerText, setFooterText] = createSignal<string>("Drag & drop files here to add them to ~/receipts");
  const [processing, setProcessing] = createSignal<string | null>(null);
  const [selectedIndex, setSelectedIndex] = createSignal<number>(0);

  const refreshFiles = async () => {
    try {
      const dir = getReceiptsDir();
      const allFiles = await Array.fromAsync(new Bun.Glob("*.pdf").scan(dir));
      setFiles(allFiles.filter(f => !f.startsWith('.')));
    } catch (err) {
      setFooterText("Error loading files");
    }
  };

  const refreshProcessedReceipts = () => {
    try {
      const receipts = getAllReceipts();
      setProcessedReceipts(receipts);
    } catch (err) {
      console.error("Error loading processed receipts:", err);
    }
  };

  const handleProcessReceipt = async (filename: string) => {
    setProcessing(filename);
    setFooterText(`Processing ${filename}...`);
    
    try {
      const result = await processReceipt(filename);
      
      if (result.success) {
        setFooterText(`✓ Processed ${filename}: ${result.extractedData?.merchant_name || 'Unknown'}`);
        refreshProcessedReceipts();
      } else {
        setFooterText(`✗ Failed to process ${filename}: ${result.message}`);
      }
      
      setTimeout(() => {
        setFooterText("Ready to process receipts");
      }, 3000);
    } catch (err) {
      setFooterText(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const isProcessed = (filename: string): boolean => {
    return processedReceipts().some(r => r.filename === filename);
  };

  const getUnprocessedFiles = () => {
    return files().filter(f => !isProcessed(f));
  };

  // Keep selected index in bounds
  createEffect(() => {
    const unprocessed = getUnprocessedFiles();
    if (unprocessed.length > 0 && selectedIndex() >= unprocessed.length) {
      setSelectedIndex(Math.max(0, unprocessed.length - 1));
    }
  });

  // Keyboard navigation
  useKeyboard((key) => {
    console.log("Key event:", key.name, "eventType:", key.eventType);
    
    // Only handle key press events, ignore key release
    if (key.eventType !== "press") {
      return;
    }
    
    const unprocessed = getUnprocessedFiles();
    
    if (unprocessed.length === 0 || processing()) {
      console.log("Ignoring key - no files or processing");
      return; // No navigation if no files or currently processing
    }

    // key.name contains the key name ("up", "down", "return", etc.)
    const keyName = key.name;
    console.log("Handling key:", keyName, "current index:", selectedIndex());

    switch (keyName) {
      case "up":
        setSelectedIndex((prev) => {
          const newIndex = Math.max(0, prev - 1);
          console.log("Moving up from", prev, "to", newIndex);
          return newIndex;
        });
        break;
      case "down":
        setSelectedIndex((prev) => {
          const newIndex = Math.min(unprocessed.length - 1, prev + 1);
          console.log("Moving down from", prev, "to", newIndex);
          return newIndex;
        });
        break;
      case "return": // Enter key
        const selected = unprocessed[selectedIndex()];
        console.log("Enter pressed, selected:", selected);
        if (selected) {
          handleProcessReceipt(selected);
        }
        break;
    }
  });

  onMount(async () => {
    // Enable console for debugging
    renderer.console.show();
    console.log("App initialized, console enabled");
    console.log("Press ` (backtick) to toggle console visibility");
    
    // Initialize database and receipts directory
    try {
      initDatabase();
      await ensureReceiptsDir();
      await refreshFiles();
      refreshProcessedReceipts();
      setFooterText("Ready - Use ↑↓ arrows to select, Enter to process. Press ` for console");
    } catch (err) {
      setFooterText("Failed to initialize: " + (err instanceof Error ? err.message : 'Unknown error'));
    }
  });

  // Handle paste events (drag-and-drop from Finder)
  usePaste(async (event: { text: string }) => {
    const pastedText = event.text;
    setFooterText(`Processing...`);

    const filePaths = await parseFilePaths(pastedText);

    if (filePaths.length === 0) {
      setFooterText(`No valid file paths found`);
      setTimeout(() => setFooterText("Drag & drop files here to add them to ~/receipts"), 3000);
      return;
    }

    let errorCount = 0;
    for (const filePath of filePaths) {
      try {
        await moveFileToReceipts(filePath);
      } catch (err) {
        errorCount++;
        setFooterText(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Refresh the list
    refreshFiles();
    
    if (errorCount === 0) {
      setFooterText(`✓ Moved ${filePaths.length} file(s) - Use ↑↓ and Enter to process`);
    } else {
      setFooterText(`Moved ${filePaths.length - errorCount} file(s), ${errorCount} failed`);
    }
    
    // Reset footer after 3 seconds
    setTimeout(() => setFooterText("Use ↑↓ arrows to select, Enter to process"), 3000);
  });

  return (
    <box flexDirection="column" flexGrow={1} padding={2}>
      {/* Header */}
      <box marginBottom={2}>
        <ascii_font font="tiny" text="Receipt Manager" />
      </box>

      {/* PDF Files List */}
      <box border={true} padding={1} flexGrow={1} flexDirection="column">
        <text attributes={TextAttributes.BOLD} marginBottom={1}>
          PDF Files ({files().length}) - Unprocessed: {getUnprocessedFiles().length}
        </text>
        {files().length > 0 ? (
          <For each={files()}>
            {(filename) => {
              const isUnprocessed = !isProcessed(filename);
              const unprocessedFiles = getUnprocessedFiles();
              const unprocessedIndex = unprocessedFiles.indexOf(filename);
              const isSelected = isUnprocessed && unprocessedIndex === selectedIndex();
              const isCurrentlyProcessing = processing() === filename;
              
              return (
                <box flexDirection="row" alignItems="center">
                  <text 
                    attributes={
                      isProcessed(filename) 
                        ? TextAttributes.DIM 
                        : isSelected 
                        ? TextAttributes.BOLD 
                        : TextAttributes.NONE
                    }
                    flexGrow={1}
                  >
                    {isSelected ? ">" : " "} 
                    {isProcessed(filename) ? "✓" : isCurrentlyProcessing ? "⋯" : "○"} 
                    {filename}
                    {isSelected && !isCurrentlyProcessing ? " [Press Enter]" : ""}
                  </text>
                </box>
              );
            }}
          </For>
        ) : (
          <text attributes={TextAttributes.DIM}>No PDF files yet</text>
        )}
      </box>

      {/* Processed Receipts Summary */}
      {processedReceipts().length > 0 && (
        <box border={true} padding={1} marginTop={1} flexDirection="column">
          <text attributes={TextAttributes.BOLD} marginBottom={1}>
            Processed ({processedReceipts().length}):
          </text>
          <For each={processedReceipts().slice(0, 5)}>
            {(receipt) => (
              <text attributes={TextAttributes.DIM}>
                {receipt.merchant_name || "Unknown"} - ${receipt.total_amount?.toFixed(2) || "0.00"} ({receipt.receipt_date || "No date"})
              </text>
            )}
          </For>
          {processedReceipts().length > 5 && (
            <text attributes={TextAttributes.DIM}>...and {processedReceipts().length - 5} more</text>
          )}
        </box>
      )}

      {/* Dynamic Footer */}
      <box position="absolute" bottom={1} left={2} right={2}>
        <text attributes={TextAttributes.DIM}>
          {footerText()}
        </text>
      </box>
    </box>
  );
}

// Render the app
render(() => <App />);
