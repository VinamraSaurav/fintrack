import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

const billItemSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('Item name as written on bill'),
      quantity: z.number().describe('Quantity purchased'),
      unit: z.string().optional().describe('Unit of measurement (kg, L, pcs, etc.)'),
      unit_price: z.number().optional().describe('Price per unit if visible'),
      amount: z.number().describe('Total amount for this item'),
      category: z.string().describe('Best matching category from the provided list'),
      subcategory: z.string().optional().describe('Best matching subcategory'),
    }),
  ),
  store_name: z.string().optional().describe('Store or vendor name if visible'),
  bill_date: z.string().optional().describe('Date on the bill in YYYY-MM-DD format'),
  total: z.number().optional().describe('Total bill amount if visible'),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const categoriesJson = formData.get('categories') as string;

    if (!file) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const categories = categoriesJson ? JSON.parse(categoriesJson) : [];
    const categoryList = categories
      .map((c: any) => {
        const subs = c.subcategories?.map((s: any) => s.name).join(', ') || '';
        return `${c.name}${subs ? ` (subcategories: ${subs})` : ''}`;
      })
      .join('\n');

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: billItemSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: 'text',
              text: `Extract all items from this bill/receipt. For each item, identify:
- Item name (as written)
- Quantity and unit
- Price per unit (if visible)
- Total amount
- Best matching category and subcategory from this list:

${categoryList}

Rules:
- Currency is INR (Indian Rupees)
- If quantity is not clear, default to 1
- If unit is not clear, use "pcs"
- Extract the store name and date if visible
- Return ALL items, don't skip any
- If you cannot read the bill clearly, return an empty items array`,
            },
          ],
        },
      ],
    });

    return Response.json({ data: result.object });
  } catch (err: any) {
    console.error('Bill scan failed:', err);
    return Response.json(
      { error: 'Failed to scan bill. Please try again or enter items manually.' },
      { status: 500 },
    );
  }
}
