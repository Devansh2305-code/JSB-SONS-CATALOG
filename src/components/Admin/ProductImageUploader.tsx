import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Check, RefreshCw } from 'lucide-react';
import { renderHangingGarment } from '../../services/hangingGarmentRenderer';
import { uploadImageToSupabase, isSupabaseConfigured } from '../../services/supabase';

interface ProductImageUploaderProps {
  images: string[];
  onChangeImages: (images: string[]) => void;
  hangingImageUrl?: string;
  onChangeHangingImage?: (url: string) => void;
  category: string;
  color: string;
  colorHex: string;
  fabric: string;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChangeImages,
  hangingImageUrl,
  onChangeHangingImage,
  category,
  color,
  colorHex,
  fabric,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingHanger, setGeneratingHanger] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

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

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setUploadNotice(null);

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
        setUploadNotice(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded successfully!`);
        setTimeout(() => setUploadNotice(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to process image:', err);
      setUploadNotice('Failed to process photo. Please try a different image.');
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-zinc-200">
          Garment Photo Upload *
        </label>
        <span className="text-[11px] text-zinc-400">
          Upload photo from camera or files (No link needed)
        </span>
      </div>

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
          {isProcessing ? 'Processing High-Res Photo...' : 'Click or Drag Garment Photo Here'}
        </h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Supports JPEG, PNG, WEBP from your phone camera or laptop storage. Upload 1 or multiple angles.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mt-3.5 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors"
        >
          Select from Device
        </button>
      </div>

      {uploadNotice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadNotice}</span>
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
          </div>

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
