# Receipt Processing Setup Guide

## Quick Start

### 1. Install Dependencies

Already installed, but if needed:
```bash
bun install
```

### 2. Configure Environment

Edit `.env` and add your OpenAI API key:
```bash
OPENAI_API_KEY=your_actual_openai_api_key_here
```

The other variables have sensible defaults:
- `DATABASE_PATH=./receipts.db` (SQLite database location)
- `ENABLE_VISION_FALLBACK=true` (use vision API for poor quality PDFs)

### 3. Run the Application

```bash
bun dev
```

The application will:
- Initialize the SQLite database (creates `receipts.db` in the project root)
- Create the `~/receipts` directory if it doesn't exist
- Display a TUI (Terminal User Interface) for managing receipts

## Using the Application

### Adding Receipt PDFs

1. **Drag and drop PDFs** from Finder into the terminal window
2. Files will be moved to `~/receipts/`
3. They'll appear in the "PDF Files" list

### Processing Receipts

1. Use **↑** and **↓** arrow keys to select an unprocessed PDF
2. Press **Enter** to process the selected receipt
3. The system will:
   - Extract text from the PDF using LangChain
   - Assess text quality (0-100%)
   - If quality < 80%, use GPT-4o vision API for better accuracy
   - Extract structured data (merchant, date, items, total)
   - Validate the data
   - Store in SQLite database

4. Processed receipts show a ✓ checkmark and appear in the "Processed" section

### Keyboard Navigation

- **↑ (Up Arrow)**: Select previous unprocessed receipt
- **↓ (Down Arrow)**: Select next unprocessed receipt  
- **Enter**: Process the currently selected receipt
- Selected receipt is shown in **bold** with a `>` indicator

### Viewing Processed Receipts

The "Processed" section shows:
- Merchant name
- Total amount
- Receipt date

The full data (including individual items) is stored in the SQLite database.

## Database Schema

### `receipts` table
- `id` - Auto-increment primary key
- `filename` - PDF filename (unique)
- `merchant_name` - Business name
- `receipt_date` - Date in YYYY-MM-DD format
- `total_amount` - Total amount
- `currency` - Currency code (default: USD)
- `raw_text` - Extracted PDF text
- `processed_at` - Timestamp
- `processing_status` - pending, complete, needs_review, or error

### `receipt_items` table
- `id` - Auto-increment primary key
- `receipt_id` - Foreign key to receipts
- `item_name` - Item description
- `quantity` - Quantity purchased
- `unit_price` - Price per unit (optional)
- `total_price` - Total for this item
- `category` - Item category (optional)

## Querying the Database

You can query the SQLite database directly:

```bash
# Install sqlite3 if not already installed
brew install sqlite3

# Query receipts
sqlite3 receipts.db "SELECT * FROM receipts;"

# Query items for a specific receipt
sqlite3 receipts.db "SELECT * FROM receipt_items WHERE receipt_id = 1;"

# Get receipts with totals
sqlite3 receipts.db "
  SELECT r.merchant_name, r.receipt_date, r.total_amount, COUNT(i.id) as item_count
  FROM receipts r
  LEFT JOIN receipt_items i ON r.id = i.receipt_id
  GROUP BY r.id;
"
```

## Cost Considerations

- **Text-only extraction**: Free (using pdf-parse)
- **Vision API usage**: ~$0.01-0.05 per receipt (only triggered when text quality < 80%)
- **Set ENABLE_VISION_FALLBACK=false** to disable vision API entirely

## Testing

Run database tests:
```bash
bun test src/db/index.test.ts
```

Run all tests:
```bash
bun test
```

## Troubleshooting

### "Missing OPENAI_API_KEY" error
- Make sure you've set `OPENAI_API_KEY` in your `.env` file
- Get an API key from https://platform.openai.com/api-keys

### Vision API not working
- Check your OpenAI account has access to GPT-4o vision
- Verify `ENABLE_VISION_FALLBACK=true` in `.env`
- Check text quality score - vision only triggers if < 80%

### Database errors
- Delete `receipts.db` to start fresh
- The database will be recreated on next run
- Check file permissions in the project directory

### PDF not processing
- Ensure the PDF contains actual text (not just scanned images)
- Check the terminal output for error messages
- Verify the PDF is in `~/receipts/` directory

## Architecture

The processing pipeline:
1. **PDF Loader** (LangChain) - Extracts text as Document objects
2. **Text Quality Assessment** - Scores readability (0-100%)
3. **Vision API** (conditional) - Used for poor quality text
4. **LLM Extraction** (GPT-4o) - Structures data as JSON
5. **Validation** - Checks data consistency
6. **Database Storage** (SQLite) - Atomic transaction with receipt + items

## Files Created

- `receipts.db` - SQLite database
- `~/receipts/*.pdf` - Receipt PDF files
- `.env` - Environment configuration (contains your API key - don't commit!)
