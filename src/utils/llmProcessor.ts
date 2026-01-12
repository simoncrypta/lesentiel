import OpenAI from "openai";
import type { ReceiptItem } from "../db/receipts.ts";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export interface ExtractedReceiptData {
  merchant_name: string;
  receipt_date: string; // ISO format YYYY-MM-DD
  total_amount: number;
  currency: string;
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price?: number;
    total_price: number;
    category?: string;
  }>;
  confidence: number; // 0-100
}

/**
 * Extract structured receipt data from text using GPT-4o
 */
export async function extractReceiptData(
  text: string
): Promise<ExtractedReceiptData> {
  const systemPrompt = `You are a receipt data extraction specialist. 
Extract structured data from receipts with high accuracy.

Extract the following information:
- Merchant name (business name)
- Receipt date (convert to ISO format YYYY-MM-DD)
- Total amount (numeric value only)
- Currency (USD, EUR, CAD, etc.)
- Individual items with:
  - Item name
  - Quantity (default to 1 if not specified)
  - Unit price (if available)
  - Total price for that item
  - Category (optional: food, beverage, retail, etc.)

Return ONLY a JSON object matching this exact structure:
{
  "merchant_name": "string",
  "receipt_date": "YYYY-MM-DD",
  "total_amount": number,
  "currency": "string",
  "items": [
    {
      "item_name": "string",
      "quantity": number,
      "unit_price": number or null,
      "total_price": number,
      "category": "string or null"
    }
  ],
  "confidence": number (0-100, your confidence in the extraction accuracy)
}

If you cannot find certain information, use reasonable defaults:
- merchant_name: "Unknown Merchant"
- receipt_date: current date
- currency: "USD"
- confidence: lower score if information is missing`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract receipt data from:\n\n${text}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const data = JSON.parse(content) as ExtractedReceiptData;
    
    // Validate data structure
    if (!data.merchant_name || !data.receipt_date || data.total_amount == null) {
      throw new Error("Incomplete receipt data extracted");
    }
    
    return data;
  } catch (error) {
    throw new Error(
      `Failed to extract receipt data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract receipt data using vision API with PDF image
 * Used when text extraction quality is poor
 */
export async function extractReceiptDataWithVision(
  pdfBase64: string,
  fallbackText?: string
): Promise<ExtractedReceiptData> {
  const systemPrompt = `You are a receipt data extraction specialist analyzing receipt images.
Extract structured data with high accuracy from the receipt image.

Extract the following information:
- Merchant name (business name)
- Receipt date (convert to ISO format YYYY-MM-DD)
- Total amount (numeric value only)
- Currency (USD, EUR, CAD, etc.)
- Individual items with names, quantities, and prices

Return ONLY a JSON object with this structure:
{
  "merchant_name": "string",
  "receipt_date": "YYYY-MM-DD",
  "total_amount": number,
  "currency": "string",
  "items": [
    {
      "item_name": "string",
      "quantity": number,
      "unit_price": number or null,
      "total_price": number,
      "category": "string or null"
    }
  ],
  "confidence": number (0-100)
}`;

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: fallbackText
              ? `Analyze this receipt image. Here's some extracted text for context (may be incomplete):\n\n${fallbackText}\n\nPlease correct any errors and extract complete receipt data from the image.`
              : "Analyze this receipt image and extract all receipt data.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:application/pdf;base64,${pdfBase64}`,
            },
          },
        ],
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI Vision");
    }

    const data = JSON.parse(content) as ExtractedReceiptData;
    
    if (!data.merchant_name || !data.receipt_date || data.total_amount == null) {
      throw new Error("Incomplete receipt data extracted from vision");
    }
    
    return data;
  } catch (error) {
    throw new Error(
      `Failed to extract receipt data with vision: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate extracted data consistency
 * Checks if items sum approximately equals total
 */
export function validateReceiptData(data: ExtractedReceiptData): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Calculate sum of item prices
  const itemsSum = data.items.reduce((sum, item) => sum + item.total_price, 0);
  
  // Check if sum is close to total (within 5% tolerance for rounding/tax)
  const tolerance = Math.max(0.05 * data.total_amount, 0.5); // 5% or $0.50 minimum
  const difference = Math.abs(itemsSum - data.total_amount);
  
  if (difference > tolerance) {
    issues.push(
      `Items sum ($${itemsSum.toFixed(2)}) doesn't match total ($${data.total_amount.toFixed(2)})`
    );
  }
  
  // Check for empty items
  if (data.items.length === 0) {
    issues.push("No items found in receipt");
  }
  
  // Check date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.receipt_date)) {
    issues.push("Invalid date format (expected YYYY-MM-DD)");
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
