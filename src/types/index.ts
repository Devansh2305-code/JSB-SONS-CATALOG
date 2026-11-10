export interface Product {
  id: string;
  sku: string;
  title: string;
  subtitle?: string;
  category: string;
  price: number;
  originalPrice?: number;
  color: string;
  colorHex: string;
  fabric: string;
  pattern?: string;
  fit: string;
  sizes: string[];
  images: string[];
  hangingImageUrl?: string;
  displayMode?: 'hanging' | 'photo';
  collarStyle?: string;
  sleeveStyle?: string;
  description: string;
  inStock: boolean;
  isFeatured?: boolean;
  createdAt: string;
  sourceType?: 'manual' | 'ai-sliced';
  rawImageId?: string;
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedGarment {
  index: number;
  title: string;
  category: string;
  color: string;
  colorHex: string;
  fabric: string;
  pattern?: string;
  collarStyle?: string;
  sleeveStyle?: string;
  hangerType?: string;
  suggestedPrice: number;
  sizes?: string[];
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  tags?: string[];
  description: string;
  croppedImageUrl?: string;
  hangingImageUrl?: string;
  isSelected?: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string; // e.g. 919876543210
  displayPhone: string;
  email: string;
  address: string;
  city: string;
  currency: string;
  announcement: string;
  workingHours: string;
  defaultEnquiryMessage: string;
  categories?: string[];
}

export interface EnquiryItem {
  product: Product;
  selectedSize: string;
  quantity: number;
  customerNote?: string;
}
