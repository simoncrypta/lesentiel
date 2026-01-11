
/**
 * Parses pasted text to extract file paths.
 * Handles multiple formats:
 * - Single file path
 * - Multiple file paths (newline or space-separated)
 * - Paths with spaces (quoted or escaped)
 * - macOS file URLs (file:// protocol)
 * 
 * @param pastedText - The text pasted into the terminal
 * @returns Array of valid file paths that exist
 */
export async function parseFilePaths(pastedText: string): Promise<string[]> {
  const trimmed = pastedText.trim();
  if (!trimmed) {
    return [];
  }

  // Split by newlines first (most common when dragging multiple files)
  const lines = trimmed.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const paths: string[] = [];
  
  for (const line of lines) {
    // Handle file:// URLs (macOS may use these)
    if (line.startsWith('file://')) {
      try {
        const url = new URL(line);
        const decodedPath = decodeURIComponent(url.pathname);
        paths.push(decodedPath);
        continue;
      } catch {
        // If URL parsing fails, try as regular path
      }
    }
    
    // Handle quoted paths (e.g., "/path/to/file with spaces.txt")
    if ((line.startsWith('"') && line.endsWith('"')) || 
        (line.startsWith("'") && line.endsWith("'"))) {
      paths.push(line.slice(1, -1));
      continue;
    }
    
    // Handle escaped spaces (e.g., /path/to/file\ with\ spaces.txt)
    if (line.includes('\\ ')) {
      paths.push(line.replace(/\\ /g, ' '));
      continue;
    }
    
    // Check if line contains multiple space-separated paths
    // This is less common, but handle it
    if (line.includes(' ') && !line.startsWith('/')) {
      // If it doesn't start with /, it's probably not a valid path
      // Skip space splitting in this case
      paths.push(line);
    } else {
      paths.push(line);
    }
  }
  
  // Filter to only return paths that actually exist
  const existingPaths: string[] = [];
  for (const path of paths) {
    const file = Bun.file(path);
    if (await file.exists()) {
      existingPaths.push(path);
    }
  }
  return existingPaths;
}

/**
 * Validates if a string looks like a valid file path
 */
export function looksLikeFilePath(text: string): boolean {
  const trimmed = text.trim();
  
  // Check for file:// protocol
  if (trimmed.startsWith('file://')) {
    return true;
  }
  
  // Check for absolute paths on Unix-like systems
  if (trimmed.startsWith('/')) {
    return true;
  }
  
  // Check for relative paths
  if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }
  
  return false;
}
