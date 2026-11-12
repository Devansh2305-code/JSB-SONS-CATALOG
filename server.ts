import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support high resolution base64 image uploads for multi-garment separation
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface SplitGarmentRequest {
  imageBase64: string; // Base64 or Data URL
  mimeType?: string;
  categoryHint?: string;
}

// AI endpoint to detect and extract garments from raw composite images
app.post('/api/ai/split-garments', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', categoryHint }: SplitGarmentRequest = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    // Clean base64 data if it includes a data:image/...;base64, prefix
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API Key is not configured on the server. Please check Settings > Secrets.',
      });
    }

    const promptText = `
You are an expert AI garment separator and fashion merchandiser for JSB SONS, a ready garments retail store.
The provided image is a RAW catalogue photo containing MULTIPLE distinct garments (for example, 4 to 8 different shirts, kurtas, jackets, or outfits laid flat, hanging on a rail, or displayed side-by-side with different colors, patterns, and collar designs).

Analyze this image and extract EVERY single distinct garment piece visible so that each can be displayed full in hanging form on a luxury wooden hanger.
For each separate garment:
1. Detect its precise bounding box [ymin, xmin, ymax, xmax] coordinates normalized from 0 to 1000 (0 is top/left, 1000 is bottom/right). Ensure the bounding box tightly encompasses the entire garment piece without cutting it off.
2. Provide a clear product title suitable for JSB SONS ready garments catalogue.
3. Categorize it appropriately ('Shirts', 'Kurtas & Ethnic', 'Jackets & Blazers', 'Trousers & Pants', or 'Festive & Wedding').
4. Determine the primary color name (e.g. 'Navy Blue', 'Olive Green', 'Rust Brown', 'Wine Red', 'Ivory Cream', 'Charcoal Grey').
5. Provide a 6-character hex color code for swatch preview (e.g. '#1e3a8a').
6. Identify fabric type and texture (e.g. 'Pure Linen', 'Cotton Twill', 'Raw Silk', 'Textured Jacquard').
7. Identify pattern type ('Plain Solid', 'Striped', 'Micro Check', 'Embroidered', 'Self Woven').
8. Identify collar style ('Spread Collar', 'Cutaway Collar', 'Mandarin Nehru Collar', 'Bandhgala High Neck', 'Notch Lapel').
9. Identify sleeve style ('Full Sleeves with Cuffs', 'Half Sleeves', 'Sleeveless').
10. Suggest an authentic ready-garment retail price in Indian Rupees (INR) between ₹1,890 and ₹8,990.
11. Suggest available sizes (e.g. ['S', 'M', 'L', 'XL', 'XXL']).
12. Write a brief 2-sentence product description.
${categoryHint ? `User note/hint: ${categoryHint}` : ''}

Return the list of detected products as a structured JSON array.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of detected garments with crop coordinates, hanging form specs, and metadata',
          items: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.INTEGER },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              color: { type: Type.STRING },
              colorHex: { type: Type.STRING },
              fabric: { type: Type.STRING },
              pattern: { type: Type.STRING },
              collarStyle: { type: Type.STRING },
              sleeveStyle: { type: Type.STRING },
              hangerType: { type: Type.STRING },
              suggestedPrice: { type: Type.INTEGER },
              sizes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              box2d: {
                type: Type.ARRAY,
                description: '[ymin, xmin, ymax, xmax] normalized 0-1000',
                items: { type: Type.NUMBER },
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              description: { type: Type.STRING },
            },
            required: [
              'title',
              'category',
              'color',
              'colorHex',
              'fabric',
              'suggestedPrice',
              'box2d',
              'description',
            ],
          },
        },
      },
    });

    const responseText = response.text || '[]';
    let detectedGarments = [];
    try {
      detectedGarments = JSON.parse(responseText);
    } catch {
      // If parsing fails, try regex extraction
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        detectedGarments = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse Gemini JSON response');
      }
    }

    return res.json({
      success: true,
      count: detectedGarments.length,
      garments: detectedGarments,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/split-garments:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze and split garments with Gemini AI.',
    });
  }
});

// Endpoint to generate a photorealistic hanging form garment image using Gemini
app.post('/api/ai/generate-hanging-image', async (req: Request, res: Response) => {
  try {
    const { title, color, fabric, category, collarStyle, croppedImageBase64 } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI not initialized' });
    }

    const prompt = `Studio catalog product photograph of a ready garment for JSB SONS: ${title || 'Luxury Garment'}, category: ${category || 'Shirts'}, color: ${color || 'Navy'}, fabric: ${fabric || 'Pure Linen'}. The garment is shown FULL in hanging form, hanging straight on a luxury polished dark walnut wooden hanger with a curved brass metal hook. Crisp ${collarStyle || 'spread collar'}, full sleeves draped neatly downward, clean front button placket, natural fabric folds and drape, high-end studio lighting on neutral soft ivory background. Frontal lookbook view.`;

    const parts: any[] = [{ text: prompt }];

    if (croppedImageBase64) {
      const cleanBase64 = croppedImageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: '3:4',
          },
        },
      });

      for (const part of imgResponse.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          return res.json({ success: true, imageUrl });
        }
      }
    } catch (modelErr: any) {
      console.warn('Image generation model not available or quota limited:', modelErr.message);
    }

    return res.json({
      success: false,
      message: 'Procedural hanging studio engine will render the garment directly.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-hanging-image:', error);
    return res.status(500).json({ error: error.message });
  }
});

// AI endpoint: Virtual Model & Mannequin Try-On Studio (powered by Python script + Gemini API)
app.post('/api/ai/virtual-tryon', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      title = 'JSB Ready Garment',
      category = 'Garments',
      color = 'Navy Blue',
      colorHex = '#1e3a8a',
      fabric = 'Pure Linen',
      modelType = 'mannequin',
    } = req.body;

    const pythonScriptPath = path.resolve(__dirname, 'scripts', 'virtual_tryon.py');
    const inputPayload = JSON.stringify({
      imageBase64: imageBase64 || '',
      title,
      category,
      color,
      colorHex,
      fabric,
      modelType,
    });

    // Execute Python script with Gemini key passed in environment
    const runPythonTryOn = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [pythonScriptPath, '--stdin'], {
          env: {
            ...process.env,
            GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
          },
        });

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (chunk) => {
          stdoutData += chunk.toString();
        });

        pythonProcess.stderr.on('data', (chunk) => {
          stderrData += chunk.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0 && stdoutData.trim()) {
            try {
              const parsed = JSON.parse(stdoutData.trim());
              resolve(parsed);
            } catch (err) {
              reject(new Error(`Failed to parse Python script output: ${err}`));
            }
          } else {
            reject(new Error(`Python script exited with code ${code}: ${stderrData}`));
          }
        });

        pythonProcess.on('error', (err) => {
          reject(err);
        });

        // Pipe JSON payload to Python stdin
        pythonProcess.stdin.write(inputPayload);
        pythonProcess.stdin.end();
      });
    };

    try {
      const pythonOutput = await runPythonTryOn();
      if (pythonOutput && pythonOutput.imageUrl) {
        return res.json(pythonOutput);
      }
    } catch (pyError: any) {
      console.warn('Python virtual_tryon.py execution warning:', pyError.message);
    }

    // Direct Node.js fallback if Python is not present in container/runtime
    if (ai) {
      try {
        const prompt = `Studio catalog fashion lookbook photograph for JSB SONS of a ${
          modelType === 'model-male'
            ? 'handsome imaginary male fashion model'
            : modelType === 'model-female'
            ? 'elegant imaginary female fashion model'
            : modelType === 'ghost-mannequin'
            ? '3D hollow ghost mannequin'
            : 'luxury bespoke tailor mannequin with polished brass stand'
        } wearing ${title}, category: ${category}, color: ${color}, fabric: ${fabric}. Soft studio lighting, ivory backdrop.`;

        const parts: any[] = [{ text: prompt }];
        if (imageBase64) {
          const cleanB64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanB64,
            },
          });
        }

        const imgResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: { parts },
          config: {
            imageConfig: { aspectRatio: '3:4' },
          },
        });

        for (const part of imgResponse.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            return res.json({
              success: true,
              imageUrl: `data:${mime};base64,${part.inlineData.data}`,
              engine: 'gemini-node',
              modelType,
              status: 'Generated with Gemini Node Engine',
            });
          }
        }
      } catch (geminiErr: any) {
        console.warn('Node Gemini image fallback:', geminiErr.message);
      }
    }

    // Fallback: return garment image
    return res.json({
      success: true,
      imageUrl: imageBase64 || '',
      engine: 'fallback',
      modelType,
      status: 'Garment photo prepared for model try-on display',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/virtual-tryon:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint: Gemini studio clean-up — removes the photo background and returns the
// garment on a pure white catalogue background while preserving fabric detail.
app.post('/api/ai/clean-product-image', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      title = 'ready garment',
      category = 'clothing',
      fabric = 'premium fabric',
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API Key is not configured on the server.',
      });
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    // Keep this prompt compact: one image-editing pass, no retries, to conserve API credits.
    const prompt = `Edit this ${category} product photo for a high-end retail catalogue. Remove the entire existing background and replace it with pure solid white (#FFFFFF). Keep the ${title} exactly the same product: preserve its true colour, fabric weave, texture, stitching, buttons, collar shape, folds and every detail. Isolate the full garment cleanly, centred, with an even margin, no mannequin, no hanger, no hands, no props, no text, no watermark and no harsh shadow. Professional e-commerce studio lighting with a very soft natural contact shadow. Sharp fabric detail, true-to-life colour, clean premium vision.`;

    const imgResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: '3:4',
        },
      },
    });

    for (const part of imgResponse.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const outMime = part.inlineData.mimeType || 'image/png';
        return res.json({
          success: true,
          imageUrl: `data:${outMime};base64,${part.inlineData.data}`,
          fabric,
        });
      }
    }

    return res.status(502).json({
      error: 'Gemini did not return a cleaned image. Please try again or use the original photo.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/clean-product-image:', error);
    return res.status(500).json({
      error:
        error.message ||
        'Gemini could not clean this image. Please try a clearer garment photo.',
    });
  }
});

// Public client configuration endpoint (provides shared Supabase credentials across all devices)
app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    store: 'JSB SONS',
    aiAvailable: !!ai,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JSB SONS Garments Catalog server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
