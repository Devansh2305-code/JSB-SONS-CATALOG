import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Check, RefreshCw, Palette, User, Shirt, Wand2, AlertCircle } from 'lucide-react';
import { renderHangingGarment } from '../../services/hangingGarmentRenderer';
import { uploadImageToSupabase, isSupabaseConfigured } from '../../services/supabase';
import { extractColorsFromImage, ExtractedColor } from '../../utils/colorExtractor';
import { generateVirtualTryOn } from '../../services/virtualTryOnService';
import { cleanProductImageWithGemini } from '../../services/studioImageService';

interface ProductImageUploaderProps {
  images: string[];
  onChangeImages: (images: string[]) => void;
  hangingImageUrl?: string;
  onChangeHangingImage?: (url: string) => void;
  modelTryOnUrl?: string;
  onChangeModelTryOn?: (url: string) => void;
  title?: string;
  category: string;
  color: string;
  colorHex: string;
  fabric: string;
  modelType?: 'mannequin' | 'model-male' | 'model-female' | 'ghost-mannequin';
  onChangeModelType?: (type: 'mannequin' | 'model-male' | 'model-female' | 'ghost-mannequin') => void;
  onAutoColorDetected?: (colorName: string, colorHex: string, palette: ExtractedColor[]) => void;
  onStudioCleanChange?: (isStudioClean: boolean) => void;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChangeImages,
  hangingImageUrl,
  onChangeHangingImage,
  modelTryOnUrl,
  onChangeModelTryOn,
  title,
  category,
  color,
  colorHex,
  fabric,
  modelType = 'mannequin',
  onChangeModelType,
  onAutoColorDetected,
  onStudioCleanChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingHanger, setGeneratingHanger] = useState(false);
  const [generatingModel, setGeneratingModel] = useState(false);
  const [selectedModelType, setSelectedModelType] = useState<
    'mannequin' | 'model-male' | 'model-female' | 'ghost-mannequin'
  >(modelType);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoStudioClean, setAutoStudioClean] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [studioCleanApplied, setStudioCleanApplied] = useState(false);

  // Resize and compress oversized images to preserve speed and prevent lag
  const processImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1400;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Single Gemini pass per upload: removes the photo background and replaces the
   * main image with a clean white studio shot. Keeping this to one call protects
   * API credits while still covering every newly added product.
   */
  const runStudioClean = async (sourceUrl: string, baseImages: string[]) => {
    if (!sourceUrl || baseImages.length === 0) return;
    setIsCleaning(true);
    setUploadError(null);
    setUploadNotice('Removing background with Gemini · preparing white studio image...');

    try {
      const result = await cleanProductImageWithGemini({
        imageBase64: sourceUrl,
        title: title || `${color} ${category}`,
        category,
        fabric,
      });

      if (result.success && result.imageUrl) {
        const updated = [...baseImages];
        updated[0] = result.imageUrl;
        onChangeImages(updated);
        setStudioCleanApplied(true);
        onStudioCleanChange?.(true);
        setUploadNotice(
          'Gemini studio clean applied — clean white background with original fabric detail preserved.'
        );
      } else {
        setUploadError(result.error || 'Gemini could not clean this photo.');
        setUploadNotice(null);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Studio cleanup failed.');
      setUploadNotice(null);
    } finally {
      setIsCleaning(false);
      setTimeout(() => setUploadNotice(null), 5000);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setUploadNotice(null);
    setUploadError(null);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        // 1. Process client-side to clean data URL
        const dataUrl = await processImageFile(file);

        // 2. If Supabase is connected, optionally upload to cloud storage
        if (isSupabaseConfigured()) {
          try {
            const uploadRes = await uploadImageToSupabase(file, file.name);
            if (uploadRes.success && uploadRes.url) {
              newUrls.push(uploadRes.url);
              continue;
            }
          } catch (storageErr) {
            console.warn('Storage upload fallback to data URL:', storageErr);
          }
        }

        newUrls.push(dataUrl);
      }

      if (newUrls.length > 0) {
        const updated = [...images, ...newUrls];
        onChangeImages(updated);

        // Run auto color detection on the primary garment photo!
        if (onAutoColorDetected && updated.length > 0) {
          try {
            const palette = await extractColorsFromImage(updated[0]);
            if (palette.length > 0) {
              onAutoColorDetected(palette[0].name, palette[0].hex, palette);
              setUploadNotice(
                `${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded · Auto-detected color: ${palette[0].name} (${palette[0].hex.toUpperCase()})`
              );
            } else {
              setUploadNotice(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded successfully!`);
            }
          } catch {
            setUploadNotice(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded successfully!`);
          }
        } else {
          setUploadNotice(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded successfully!`);
        }

        if (autoStudioClean) {
          await runStudioClean(updated[0], updated);
        } else {
          setTimeout(() => setUploadNotice(null), 4000);
        }
      }
    } catch (err: any) {
      console.error('Failed to process image:', err);
      setUploadError('Failed to process photo. Please try a different image.');
      setUploadNotice(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    onChangeImages(updated);
    if (index === 0) {
      setStudioCleanApplied(false);
      onStudioCleanChange?.(false);
    }
  };

  // Generate luxury hanging form from the primary photo
  const handleGenerateHangingForm = async () => {
    if (images.length === 0 || !onChangeHangingImage) return;
    setGeneratingHanger(true);

    try {
      const primaryImage = images[0];
      const hangerUrl = await renderHangingGarment({
        croppedImageUrl: primaryImage,
        category,
        colorName: color,
        colorHex,
        fabric,
        title: `${color} ${category}`,
      });
      onChangeHangingImage(hangerUrl);
      setUploadNotice('Hanging form with wooden hanger generated successfully!');
      setTimeout(() => setUploadNotice(null), 3500);
    } catch (err) {
      console.error('Failed to generate hanging form:', err);
    } finally {
      setGeneratingHanger(false);
    }
  };

  // Generate Virtual Model / Mannequin Try-On using Python + Gemini AI
  const handleGenerateModelTryOn = async () => {
    if (images.length === 0 || !onChangeModelTryOn) return;
    setGeneratingModel(true);

    try {
      const primaryImage = images[0];
      const result = await generateVirtualTryOn({
        imageBase64: primaryImage,
        title: title || `${color} ${category}`,
        category,
        color,
        colorHex,
        fabric,
        modelType: selectedModelType,
      });

      if (result.success && result.imageUrl) {
        onChangeModelTryOn(result.imageUrl);
        if (onChangeModelType) onChangeModelType(selectedModelType);
        setUploadNotice(
          `✨ Virtual ${selectedModelType.replace('-', ' ')} try-on generated successfully!`
        );
      } else {
        setUploadNotice(result.message || 'Model generation completed.');
      }
      setTimeout(() => setUploadNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to generate virtual model try-on:', err);
      setUploadNotice('Failed to generate model try-on. Please try again.');
    } finally {
      setGeneratingModel(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-zinc-200">
          Garment Photo Upload *
        </label>
        <span className="text-[11px] text-amber-300/90 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Auto-detects colors from your photo</span>
        </span>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-zinc-900/70 px-3.5 py-2.5 cursor-pointer">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-zinc-200">
              Gemini studio white background
            </span>
            <span className="block text-[10px] text-zinc-400 leading-tight">
              One AI pass per upload · pure white background, original fabric preserved
            </span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={autoStudioClean}
          onChange={(e) => setAutoStudioClean(e.target.checked)}
          className="h-4 w-4 accent-amber-400 shrink-0 cursor-pointer"
        />
      </label>

      {/* Hidden native input with camera & gallery capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Upload Zone / Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-amber-400 bg-amber-400/10'
            : 'border-zinc-700/80 hover:border-amber-400/60 bg-zinc-900/60 hover:bg-zinc-900'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
          {isProcessing ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <h4 className="text-sm font-semibold text-zinc-100">
          {isProcessing ? 'Analyzing & Extracting Garment Colors...' : 'Click or Drag Garment Photo Here'}
        </h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Supports photos from phone camera or files. System automatically extracts the garment color and palette!
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mt-3.5 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors cursor-pointer"
        >
          Select from Device
        </button>
      </div>

      {uploadNotice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          {isCleaning ? (
            <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{uploadNotice}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Uploaded Photos ({images.length})</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              + Add another angle
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 group shadow"
              >
                <img
                  src={imgUrl}
                  alt={`Garment preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary badge */}
                {idx === 0 && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-400 text-zinc-950 uppercase tracking-wider shadow">
                    Main Photo
                  </span>
                )}

                {idx === 0 && studioCleanApplied && (
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white text-zinc-900 uppercase tracking-wider shadow flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    White studio
                  </span>
                )}

                {idx === 0 && isCleaning && (
                  <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-amber-300">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                      Cleaning background
                    </span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-zinc-950/80 hover:bg-rose-950 text-zinc-300 hover:text-rose-300 border border-zinc-700 transition-colors cursor-pointer"
                  title="Remove this photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Optional Hanging Form Preview */}
            {hangingImageUrl && (
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-950 border border-amber-500/40 group shadow">
                <img
                  src={hangingImageUrl}
                  alt="Hanging Form Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-950/90 text-amber-300 border border-amber-500/40 shadow">
                  🪝 Hanging Form
                </span>
                {onChangeHangingImage && (
                  <button
                    type="button"
                    onClick={() => onChangeHangingImage('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-zinc-950/80 hover:bg-rose-950 text-zinc-300 hover:text-rose-300 border border-zinc-700 transition-colors cursor-pointer"
                    title="Remove hanging form"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Optional Virtual Model Try-On Preview */}
            {modelTryOnUrl && (
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-950 border border-emerald-500/50 group shadow">
                <img
                  src={modelTryOnUrl}
                  alt="Virtual Model Try-On Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-950/90 text-emerald-300 border border-emerald-500/40 shadow">
                  🧍 Model Try-On
                </span>
                {onChangeModelTryOn && (
                  <button
                    type="button"
                    onClick={() => onChangeModelTryOn('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-zinc-950/80 hover:bg-rose-950 text-zinc-300 hover:text-rose-300 border border-zinc-700 transition-colors cursor-pointer"
                    title="Remove model try-on"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Gemini studio clean action box */}
          <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-amber-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 text-xs block">
                    Clean studio product image (Gemini)
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    {studioCleanApplied
                      ? 'Main photo is on a clean white background with fabric detail preserved.'
                      : 'Remove the background from the main photo — ideal for a premium catalogue look.'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    studioCleanApplied &&
                    !window.confirm(
                      'Re-clean this photo? This will use one more Gemini image credit.'
                    )
                  ) {
                    return;
                  }
                  runStudioClean(images[0], images);
                }}
                disabled={isCleaning || isProcessing}
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm active:scale-95"
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cleaning with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{studioCleanApplied ? 'Re-clean photo' : 'Clean background'}</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Uses one Gemini image edit to protect API credits. Re-clean only if the first result
              needs improvement.
            </p>
          </div>

          {/* Virtual Model / Mannequin Try-On Action Box */}
          {onChangeModelTryOn && (
            <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-amber-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-200 text-xs block">
                      AI Virtual Model / Mannequin Try-On (Python + Gemini)
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      {modelTryOnUrl
                        ? 'Imaginary model try-on image active and displayed to catalog visitors.'
                        : 'Generate an imaginary mannequin or fashion model trying on this garment.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateModelTryOn}
                  disabled={generatingModel}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm active:scale-95"
                >
                  {generatingModel ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Model Look...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{modelTryOnUrl ? 'Re-generate Model Look' : 'Generate Model Try-On'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Model Style Selector Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
                <span className="text-[11px] text-zinc-400 font-medium">Model Style:</span>
                {[
                  { id: 'mannequin', label: '🧍 Tailor Mannequin' },
                  { id: 'model-male', label: '👤 Male Model' },
                  { id: 'model-female', label: '👩 Female Model' },
                  { id: 'ghost-mannequin', label: '🧥 Ghost 3D' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelType(s.id as any);
                      if (onChangeModelType) onChangeModelType(s.id as any);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors cursor-pointer ${
                      selectedModelType === s.id
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-500/50 shadow-sm font-semibold'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hanging Form Generation Action */}
          {onChangeHangingImage && (
            <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-200 block">
                    Luxury Wooden Hanger Display
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    {hangingImageUrl
                      ? 'Hanging display is created and ready for catalog customers.'
                      : 'Automatically generate a studio wooden hanger render from this photo.'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateHangingForm}
                disabled={generatingHanger}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
              >
                {generatingHanger ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering Hanger...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{hangingImageUrl ? 'Re-render Hanger' : 'Generate Hanging Form'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
