import { GoogleGenAI } from '@google/genai';

interface CleanImageRequest {
  method?: string;
  body?: {
    imageBase64?: string;
    mimeType?: string;
    title?: string;
    category?: string;
    fabric?: string;
  };
}

interface CleanImageResponse {
  setHeader(name: string, value: string): void;
  status(code: number): CleanImageResponse;
  json(body: unknown): void;
}

export const config = { maxDuration: 60 };

/**
 * Vercel serverless twin of POST /api/ai/clean-product-image from server.ts.
 * One Gemini image edit removes the photo background and returns the garment
 * on pure white while preserving fabric colour, weave and stitching.
 */
export default async function handler(
  req: CleanImageRequest,
  res: CleanImageResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    res.status(503).json({ error: 'Gemini API Key is not configured on the server.' });
    return;
  }

  const {
    imageBase64,
    mimeType = 'image/jpeg',
    title = 'ready garment',
    category = 'clothing',
    fabric = 'premium fabric',
  } = req.body || {};

  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64 is required.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const prompt = `Edit this ${category} product photo for a high-end retail catalogue. Remove the entire existing background and replace it with pure solid white (#FFFFFF). Keep the ${title} exactly the same product: preserve its true colour, fabric weave, texture, stitching, buttons, collar shape, folds and every detail. Isolate the full garment cleanly, centred, with an even margin, no mannequin, no hanger, no hands, no props, no text, no watermark and no harsh shadow. Professional e-commerce studio lighting with a very soft natural contact shadow. Sharp fabric detail, true-to-life colour, clean premium vision.`;

    const imgResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } },
        ],
      },
      config: { imageConfig: { aspectRatio: '3:4' } },
    });

    for (const part of imgResponse.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const outMime = part.inlineData.mimeType || 'image/png';
        res.json({
          success: true,
          imageUrl: `data:${outMime};base64,${part.inlineData.data}`,
          fabric,
        });
        return;
      }
    }

    res.status(502).json({
      error: 'Gemini did not return a cleaned image. Please try again or use the original photo.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/clean-product-image:', error);
    res.status(500).json({
      error:
        error?.message || 'Gemini could not clean this image. Please try a clearer garment photo.',
    });
  }
}
