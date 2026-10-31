import { Product, EnquiryItem } from '../types';

/**
 * Creates a direct WhatsApp chat URL prefilled with garment details and catalog link
 */
export function createWhatsAppEnquiryLink(
  phoneNumber: string,
  product: Product,
  selectedSize?: string,
  userMessage?: string
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const productUrl = `${window.location.origin}?item=${encodeURIComponent(product.sku)}`;

  let msg = `*Hello JSB SONS,* 👔\n\n`;
  msg += `I am interested in this ready garment from your online catalog:\n\n`;
  msg += `▪ *Product:* ${product.title}\n`;
  msg += `▪ *SKU Code:* ${product.sku}\n`;
  msg += `▪ *Price:* ₹${product.price.toLocaleString('en-IN')}\n`;
  msg += `▪ *Color:* ${product.color}\n`;
  msg += `▪ *Fabric:* ${product.fabric}\n`;
  if (selectedSize) {
    msg += `▪ *Size Needed:* ${selectedSize}\n`;
  }
  msg += `▪ *Catalog Link:* ${productUrl}\n\n`;

  if (userMessage && userMessage.trim()) {
    msg += `▪ *My Inquiry:* ${userMessage.trim()}\n\n`;
  }

  msg += `Please confirm availability for delivery / store visit. Thank you!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Creates a bundled WhatsApp inquiry for multiple items in the customer's enquiry list
 */
export function createBundleWhatsAppEnquiryLink(
  phoneNumber: string,
  items: EnquiryItem[],
  customerNote?: string
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let msg = `*Hello JSB SONS,* 👔\n\n`;
  msg += `I would like to inquire about the following ${items.length} garments from your ready catalog:\n\n`;

  items.forEach((item, index) => {
    msg += `${index + 1}. *${item.product.title}* (${item.product.sku})\n`;
    msg += `   • Size: ${item.selectedSize} | Qty: ${item.quantity}\n`;
    msg += `   • Color: ${item.product.color}\n`;
    msg += `   • Price: ₹${(item.product.price * item.quantity).toLocaleString('en-IN')}\n\n`;
  });

  msg += `*Estimated Total:* ₹${totalAmount.toLocaleString('en-IN')}\n\n`;

  if (customerNote && customerNote.trim()) {
    msg += `*Customer Note:* ${customerNote.trim()}\n\n`;
  }

  msg += `Please let me know if these are in stock and the delivery timeline. Thank you!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}
