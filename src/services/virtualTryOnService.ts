/**
 * Virtual Try-On Service
 * Calls the Python-powered Gemini Virtual Studio backend to generate an imaginary model
 * or luxury tailor mannequin trying on the uploaded garment.
 */

export interface VirtualTryOnParams {
  imageBase64: string;
  title?: string;
  category?: string;
  color?: string;
  colorHex?: string;
  fabric?: string;
  modelType?: 'mannequin' | 'model-male' | 'model-female' | 'ghost-mannequin';
}

export interface VirtualTryOnResult {
  success: boolean;
  imageUrl: string;
  engine?: string;
  modelType?: string;
  message?: string;
}

export async function generateVirtualTryOn(params: VirtualTryOnParams): Promise<VirtualTryOnResult> {
  try {
    const res = await fetch('/api/ai/virtual-tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: params.imageBase64,
        title: params.title || 'JSB Ready Garment',
        category: params.category || 'Garments',
        color: params.color || 'Navy Blue',
        colorHex: params.colorHex || '#1e3a8a',
        fabric: params.fabric || 'Pure Cotton',
        modelType: params.modelType || 'mannequin',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      imageUrl: data.imageUrl,
      engine: data.engine || 'virtual-studio',
      modelType: data.modelType || params.modelType || 'mannequin',
      message: data.status || data.message || 'Model try-on generated successfully.',
    };
  } catch (error: any) {
    console.warn('Backend virtual-tryon endpoint notice:', error.message);
    // Fallback: return the original image if backend is temporarily unreachable
    return {
      success: false,
      imageUrl: params.imageBase64,
      modelType: params.modelType || 'mannequin',
      message: error.message || 'Virtual try-on unavailable.',
    };
  }
}
