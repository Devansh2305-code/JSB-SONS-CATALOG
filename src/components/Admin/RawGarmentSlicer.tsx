import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Crop,
  Layers,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Sliders,
  Eye,
  Trash2,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { Product, DetectedGarment } from '../../types';
import { SAMPLE_RAW_COMPOSITES, DEFAULT_CATEGORIES } from '../../data/initialProducts';
import {
  loadImage,
  cropGarmentFromCanvas,
  callAiGarmentSplitter,
  generateHeuristicSlices,
  resizeImageForAi,
} from '../../services/aiSlicer';
import { renderHangingGarment } from '../../services/hangingGarmentRenderer';

interface RawGarmentSlicerProps {
  onPublishProducts: (newProducts: Product[]) => void;
  onExitToStore: () => void;
  categories?: string[];
}

export const RawGarmentSlicer: React.FC<RawGarmentSlicerProps> = ({
  onPublishProducts,
  onExitToStore,
  categories,
}) => {
  const [selectedRawImage, setSelectedRawImage] = useState<string>(
    SAMPLE_RAW_COMPOSITES[0].imageUrl
  );
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [detectedGarments, setDetectedGarments] = useState<DetectedGarment[]>([]);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);
  const [categoryPreset, setCategoryPreset] = useState<string>(
    categories && categories.length > 0 ? categories[0] : 'Government School Uniforms'
  );
  const [displayView, setDisplayView] = useState<'hanging' | 'crop'>('hanging');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // When image or detected garments change, generate cropped previews and full hanging form renders
  const processCropPreviews = async (imgSrc: string, garments: DetectedGarment[]) => {
    try {
      const img = await loadImage(imgSrc);
      const updated = await Promise.all(
        garments.map(async (g) => {
          const croppedUrl = cropGarmentFromCanvas(img, g.box2d);
          const hangingUrl = await renderHangingGarment({
            croppedImageUrl: croppedUrl,
            category: g.category || categoryPreset,
            colorHex: g.colorHex || '#1e3a8a',
            colorName: g.color || 'Navy',
            fabric: g.fabric || 'Pure Linen',
            pattern: g.pattern || 'Plain Woven',
            collarStyle: g.collarStyle || 'Spread Collar',
            sleeveStyle: g.sleeveStyle || 'Full Sleeves with Cuffs',
            title: g.title,
          });

          return {
            ...g,
            croppedImageUrl: croppedUrl,
            hangingImageUrl: hangingUrl,
            isSelected: true,
          };
        })
      );
      setDetectedGarments(updated);
    } catch (err) {
      console.error('Failed to crop previews:', err);
    }
  };

  const regenerateHangingForm = async (index: number) => {
    const g = detectedGarments[index];
    if (!g) return;
    try {
      const newHangingUrl = await renderHangingGarment({
        croppedImageUrl: g.croppedImageUrl,
        category: g.category || categoryPreset,
        colorHex: g.colorHex || '#1e3a8a',
        colorName: g.color || 'Navy',
        fabric: g.fabric || 'Pure Linen',
        pattern: g.pattern || 'Plain Woven',
        collarStyle: g.collarStyle || 'Spread Collar',
        sleeveStyle: g.sleeveStyle || 'Full Sleeves with Cuffs',
        title: g.title,
      });
      setDetectedGarments((prev) =>
        prev.map((item, i) => (i === index ? { ...item, hangingImageUrl: newHangingUrl } : item))
      );
    } catch (err) {
      console.error('Failed to regenerate hanging form:', err);
    }
  };

  // Run initial preview for sample
  useEffect(() => {
    // Auto-generate initial slices for default sample
    const initialSlices = generateHeuristicSlices('horizontal-5', 'Shirts');
    processCropPreviews(selectedRawImage, initialSlices);
  }, []);

  const handleSelectSample = (sample: (typeof SAMPLE_RAW_COMPOSITES)[0]) => {
    setSelectedRawImage(sample.imageUrl);
    setIsCustomUpload(false);
    setPublishedCount(null);
    const cat = sample.categoryHint as any;
    setCategoryPreset(cat);

    // Initial smart slices
    const slices = generateHeuristicSlices(
      'horizontal-5',
      cat === 'Jackets & Blazers' ? 'Jackets & Blazers' : 'Shirts'
    );
    processCropPreviews(sample.imageUrl, slices);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setSelectedRawImage(dataUrl);
      setIsCustomUpload(true);
      setPublishedCount(null);
      
      // 1. Immediately show instant fast slices (0.05s response, zero waiting)
      const instantSlices = generateHeuristicSlices('horizontal-5', categoryPreset);
      await processCropPreviews(dataUrl, instantSlices);

      // 2. Then run fast AI analysis with downscaled image
      triggerAiSeparation(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const triggerAiSeparation = async (imgSrc: string = selectedRawImage) => {
    setIsProcessing(true);
    setStatusMessage('Scanning garments with Gemini AI...');
    setPublishedCount(null);

    try {
      // First ensure image is loaded
      const img = await loadImage(imgSrc);

      // Fast downscale to ~900px so payload is ~90KB instead of 10MB!
      const downscaledBase64 = resizeImageForAi(img, 900);

      setStatusMessage('Detecting clothes and colorways...');
      const aiResult = await callAiGarmentSplitter(downscaledBase64, categoryPreset);

      if (aiResult.success && aiResult.garments.length > 0) {
        setStatusMessage(`Found ${aiResult.garments.length} garments! Slicing...`);
        await processCropPreviews(imgSrc, aiResult.garments);
      } else {
        // Fallback to high-precision heuristic layout slicer
        const heuristic = generateHeuristicSlices('horizontal-5', categoryPreset);
        await processCropPreviews(imgSrc, heuristic);
      }
    } catch (err: any) {
      console.warn('Fast fallback applied:', err);
      const heuristic = generateHeuristicSlices('horizontal-5', categoryPreset);
      await processCropPreviews(imgSrc, heuristic);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // Quick fallback layout slicer
  const handleSmartSplit = (mode: 'horizontal-5' | 'horizontal-6') => {
    const slices = generateHeuristicSlices(mode, categoryPreset);
    processCropPreviews(selectedRawImage, slices);
  };

  const updateGarmentField = (index: number, field: keyof DetectedGarment, val: any) => {
    setDetectedGarments((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: val } : g))
    );
  };

  const toggleGarmentSelected = (index: number) => {
    setDetectedGarments((prev) =>
      prev.map((g, i) => (i === index ? { ...g, isSelected: !g.isSelected } : g))
    );
  };

  const handleBulkPublish = () => {
    const toImport = detectedGarments.filter((g) => g.isSelected !== false);
    if (toImport.length === 0) return;

    const timestamp = Date.now();
    const newProducts: Product[] = toImport.map((g, i) => {
      const skuNumber = Math.floor(100 + Math.random() * 900);
      const primaryImage = g.hangingImageUrl || g.croppedImageUrl || selectedRawImage;
      const secondaryImage = g.croppedImageUrl || selectedRawImage;

      return {
        id: `sliced-${timestamp}-${i}`,
        sku: `JSB-${g.category.substring(0, 3).toUpperCase()}-${skuNumber}`,
        title: g.title,
        subtitle: `${g.fabric} · Full Hanging Form`,
        category: (g.category as any) || categoryPreset || 'Shirts',
        price: Number(g.suggestedPrice) || 2490,
        originalPrice: Math.round((Number(g.suggestedPrice) || 2490) * 1.25),
        color: g.color,
        colorHex: g.colorHex || '#1e293b',
        fabric: g.fabric,
        pattern: g.pattern || 'Plain Woven',
        collarStyle: g.collarStyle || 'Spread Collar',
        sleeveStyle: g.sleeveStyle || 'Full Sleeves with Cuffs',
        fit: 'Regular Fit',
        sizes: g.sizes && g.sizes.length > 0 ? g.sizes : ['38 (S)', '40 (M)', '42 (L)', '44 (XL)'],
        images: [primaryImage, secondaryImage],
        hangingImageUrl: g.hangingImageUrl,
        displayMode: 'hanging',
        description: g.description,
        inStock: true,
        isFeatured: i === 0,
        createdAt: new Date().toISOString(),
        sourceType: 'ai-sliced',
      };
    });

    onPublishProducts(newProducts);
    setPublishedCount(newProducts.length);
  };

  return (
    <div className="space-y-8">
      {/* Intro banner */}
      <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-600/30 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AUTOMATIC PHOTO SEPARATOR</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-zinc-100">
              Split 5–6 Products From One Photo
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Upload any picture with 5 to 6 clothes of different colors or designs. The AI system automatically finds each piece, cuts them into separate product cards with colors and prices, and adds them to your shop with 1 click.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-semibold rounded flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Or test with sample batch photos:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_RAW_COMPOSITES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedRawImage === sample.imageUrl
                  ? 'bg-amber-400/10 text-amber-300 border-amber-500/40 font-medium'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stage: Raw Image with Interactive Bounding Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Bounding Box Canvas Overlay */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Raw Source Image & Garment Detection Stage</span>
            </h3>
            <span className="text-xs text-zinc-400">
              {detectedGarments.length} Detected Garments
            </span>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner group">
            <img
              ref={imageRef}
              src={selectedRawImage}
              alt="Raw Multi-Garment Source"
              className="w-full h-auto object-contain block"
              referrerPolicy="no-referrer"
            />

            {/* Bounding box overlays */}
            {detectedGarments.map((garment, idx) => {
              const [ymin, xmin, ymax, xmax] = garment.box2d;
              const top = `${ymin / 10}%`;
              const left = `${xmin / 10}%`;
              const width = `${(xmax - xmin) / 10}%`;
              const height = `${(ymax - ymin) / 10}%`;
              const isActive = activeBoxIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveBoxIndex(idx)}
                  onMouseLeave={() => setActiveBoxIndex(null)}
                  style={{ top, left, width, height }}
                  className={`absolute border-2 transition-all duration-200 cursor-pointer pointer-events-auto flex flex-col justify-between p-1 ${
                    isActive
                      ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.5)] z-20'
                      : 'border-emerald-400/80 bg-emerald-500/10 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-zinc-950/90 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                      #{idx + 1}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full border border-white/50"
                      style={{ backgroundColor: garment.colorHex }}
                      title={garment.color}
                    />
                  </div>
                  <span className="bg-zinc-950/90 text-zinc-200 text-[9px] px-1 py-0.5 rounded truncate max-w-full font-medium">
                    {garment.color}
                  </span>
                </div>
              );
            })}

            {/* Slicing spinner */}
            {isProcessing && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mb-3" />
                <p className="text-zinc-100 font-semibold text-sm">{statusMessage}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Using @google/genai Gemini 3.8 Flash to map garment contours
                </p>
              </div>
            )}
          </div>

          {/* Slicing Controls Toolbar */}
          <div className="p-4 bg-zinc-900/80 rounded-lg border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerAiSeparation()}
                disabled={isProcessing}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold rounded flex items-center gap-2 transition-all cursor-pointer shadow disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Re-Analyze with Gemini AI</span>
              </button>

              <button
                onClick={() => handleSmartSplit('horizontal-5')}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Split horizontally into 5 garments"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>5-Strip Slicer</span>
              </button>

              <button
                onClick={() => handleSmartSplit('horizontal-6')}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Split horizontally into 6 garments"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>6-Strip Slicer</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Category:</span>
              <select
                value={categoryPreset}
                onChange={(e) => setCategoryPreset(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
              >
                {(categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Sliced Individual Product Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Crop className="w-4 h-4 text-emerald-400" />
                <span>Individually Extracted Garment Cards</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Ready to be published as distinct standalone catalog items
              </p>
            </div>

            <button
              onClick={handleBulkPublish}
              disabled={detectedGarments.length === 0}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Publish All to Catalog ({detectedGarments.length})</span>
            </button>
          </div>

          {/* Display View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg">
            <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <span>Extracted Display Mode:</span>
            </span>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800">
              <button
                onClick={() => setDisplayView('hanging')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer ${
                  displayView === 'hanging'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🪝 Full Hanging Form</span>
              </button>
              <button
                onClick={() => setDisplayView('crop')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer ${
                  displayView === 'crop'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>📷 Raw Photo Crop</span>
              </button>
            </div>
          </div>

          {/* Published notification */}
          {publishedCount !== null && (
            <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Success!</strong> {publishedCount} separate garments published to your live storefront in full hanging form!
                </span>
              </div>
              <button
                onClick={onExitToStore}
                className="px-3 py-1 bg-emerald-400 text-zinc-950 font-bold rounded hover:bg-emerald-300 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>View Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Extracted cards scrollable list */}
          <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
            {detectedGarments.map((garment, idx) => {
              const currentImg =
                displayView === 'hanging'
                  ? garment.hangingImageUrl || garment.croppedImageUrl
                  : garment.croppedImageUrl;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveBoxIndex(idx)}
                  onMouseLeave={() => setActiveBoxIndex(null)}
                  className={`p-4 rounded-lg border transition-all ${
                    activeBoxIndex === idx
                      ? 'bg-zinc-900 border-amber-400/80 shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Garment thumbnail with hanging/crop toggle */}
                    <div className="w-full sm:w-28 aspect-[3/4] rounded-md bg-zinc-950 border border-zinc-700/80 overflow-hidden shrink-0 relative flex flex-col items-center justify-center group/thumb">
                      {currentImg ? (
                        <img
                          src={currentImg}
                          alt={garment.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-[10px] text-zinc-500 p-2 text-center">Rendering...</div>
                      )}

                      <span className="absolute top-1.5 left-1.5 bg-zinc-950/90 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40">
                        #{idx + 1}
                      </span>

                      {/* Small badge indicating mode */}
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-zinc-950/90 text-[9px] font-medium text-zinc-200 px-1 py-0.5 rounded text-center truncate border border-zinc-800">
                        {displayView === 'hanging' ? '🪝 Hanging Form' : '📷 Photo Crop'}
                      </span>
                    </div>

                    {/* Editable metadata fields */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text"
                          value={garment.title}
                          onChange={(e) => updateGarmentField(idx, 'title', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs font-semibold text-zinc-100 focus:outline-none focus:border-amber-400"
                          title="Product title"
                        />
                        <input
                          type="checkbox"
                          checked={garment.isSelected !== false}
                          onChange={() => toggleGarmentSelected(idx)}
                          className="w-4 h-4 rounded text-amber-500 mt-1 shrink-0 accent-amber-500 cursor-pointer"
                          title="Include in catalog"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-zinc-400 block">Color</label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="color"
                              value={garment.colorHex || '#1e3a8a'}
                              onChange={(e) => {
                                updateGarmentField(idx, 'colorHex', e.target.value);
                              }}
                              className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={garment.color}
                              onChange={(e) => updateGarmentField(idx, 'color', e.target.value)}
                              className="w-full px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block">Price (₹)</label>
                          <input
                            type="number"
                            value={garment.suggestedPrice}
                            onChange={(e) =>
                              updateGarmentField(idx, 'suggestedPrice', parseInt(e.target.value, 10))
                            }
                            className="w-full mt-0.5 px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[11px] font-semibold text-zinc-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-zinc-400 block">Fabric</label>
                          <input
                            type="text"
                            value={garment.fabric}
                            onChange={(e) => updateGarmentField(idx, 'fabric', e.target.value)}
                            className="w-full mt-0.5 px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block">Collar Style</label>
                          <select
                            value={garment.collarStyle || 'Spread Collar'}
                            onChange={(e) => {
                              updateGarmentField(idx, 'collarStyle', e.target.value);
                              setTimeout(() => regenerateHangingForm(idx), 50);
                            }}
                            className="w-full mt-0.5 px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-amber-400"
                          >
                            <option value="Spread Collar">Spread Collar</option>
                            <option value="Cutaway Collar">Cutaway Collar</option>
                            <option value="Mandarin Nehru Collar">Mandarin / Nehru</option>
                            <option value="Bandhgala High Neck">Bandhgala High Neck</option>
                            <option value="Notch Lapel">Tailored Lapel</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => regenerateHangingForm(idx)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer underline"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Update Hanging Form Render</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
