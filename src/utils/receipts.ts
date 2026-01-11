import { basename, join } from "path";
import { homedir } from "os";

const RECEIPTS_DIR = join(homedir(), "receipts");

/**
 * Ensures the /receipts directory exists at the root of the machine.
 * Creates it if it doesn't exist.
 * @throws Error if directory cannot be created (e.g., permission issues)
 */
export async function ensureReceiptsDir(): Promise<void> {
  try {
    const file = Bun.file(RECEIPTS_DIR);
    if (!(await file.exists())) {
      await Bun.write(join(RECEIPTS_DIR, ".keep"), "");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create ${RECEIPTS_DIR}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Moves a file from sourcePath to the /receipts directory.
 * @param sourcePath - Absolute path to the source file
 * @returns The filename of the moved file
 * @throws Error if file doesn't exist, cannot be moved, or destination already exists
 */
export async function moveFileToReceipts(sourcePath: string): Promise<string> {
  // Validate source file exists
  const sourceFile = Bun.file(sourcePath);
  if (!(await sourceFile.exists())) {
    throw new Error(`Source file does not exist: ${sourcePath}`);
  }

  // Check if source is a file (not a directory)
  if (sourceFile.size === undefined) {
    throw new Error(`Source is not a file: ${sourcePath}`);
  }

  const filename = basename(sourcePath);
  const destPath = join(RECEIPTS_DIR, filename);

  // Check if destination already exists
  const destFile = Bun.file(destPath);
  if (await destFile.exists()) {
    throw new Error(`File already exists in receipts: ${filename}`);
  }

  try {
    // Copy file to destination
    await Bun.write(destPath, sourceFile);
    
    // Delete original file
    await Bun.write(sourcePath, ""); // Clear content
    // Note: Bun doesn't have a direct unlink, so we use shell command
    await Bun.spawn(["rm", sourcePath]).exited;
    
    return filename;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Gets the receipts directory path
 */
export function getReceiptsDir(): string {
  return RECEIPTS_DIR;
}
