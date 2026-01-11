import { TextAttributes } from "@opentui/core";
import { render, usePaste } from "@opentui/solid";
import { createSignal, onMount, For } from "solid-js";
import { ensureReceiptsDir, moveFileToReceipts, getReceiptsDir } from "./utils/receipts.ts";
import { parseFilePaths } from "./utils/fileParser.ts";

function App() {
  const [receipts, setReceipts] = createSignal<string[]>([]);
  const [footerText, setFooterText] = createSignal<string>("Drag & drop files here to add them to ~/receipts");

  const refreshReceipts = async () => {
    try {
      const dir = getReceiptsDir();
      const files = await Array.fromAsync(new Bun.Glob("*").scan(dir));
      setReceipts(files.filter(f => !f.startsWith('.')));
    } catch (err) {
      setFooterText("Error loading receipts");
    }
  };

  onMount(async () => {
    // Ensure /receipts directory exists on startup
    try {
      await ensureReceiptsDir();
      await refreshReceipts();
      setFooterText("Drag & drop files here to add them to ~/receipts");
    } catch (err) {
      setFooterText("Failed to initialize receipts directory");
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
    refreshReceipts();
    
    if (errorCount === 0) {
      setFooterText(`✓ Moved ${filePaths.length} file(s)`);
    } else {
      setFooterText(`Moved ${filePaths.length - errorCount} file(s), ${errorCount} failed`);
    }
    
    // Reset footer after 3 seconds
    setTimeout(() => setFooterText("Drag & drop files here to add them to ~/receipts"), 3000);
  });

  return (
    <box flexDirection="column" flexGrow={1} padding={2}>
      {/* Header */}
      <box marginBottom={2}>
        <ascii_font font="tiny" text="Receipt Manager" />
      </box>

      {/* Receipts List */}
      <box border={true} padding={1} flexGrow={1} flexDirection="column">
        <text attributes={TextAttributes.BOLD} marginBottom={1}>
          Receipts ({receipts().length}):
        </text>
        {receipts().length > 0 ? (
          <For each={receipts()}>
            {(filename) => <text attributes={TextAttributes.DIM}>{filename}</text>}
          </For>
        ) : (
          <text attributes={TextAttributes.DIM}>No receipts yet</text>
        )}
      </box>

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
