/**
 * Hanging Garment Studio Engine for JSB SONS
 * Transforms extracted garment pieces into full hanging garments on luxury wooden hangers.
 */

import { DetectedGarment } from '../types';

interface RenderHangingOptions {
  croppedImageUrl?: string;
  category: string;
  colorHex: string;
  colorName: string;
  fabric: string;
  pattern?: string;
  collarStyle?: string;
  sleeveStyle?: string;
  title: string;
}

/**
 * Procedurally renders a high-definition (800x1060) studio photograph of a garment
 * displayed full in hanging form on a luxury wooden hanger.
 */
export async function renderHangingGarment(options: RenderHangingOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1060;
  const ctx = canvas.getContext('2d');
  if (!ctx) return options.croppedImageUrl || '';

  const {
    croppedImageUrl,
    category = 'Shirts',
    colorHex = '#1e3a8a',
    collarStyle = 'Spread Collar',
    fabric = 'Pure Linen',
    title = 'JSB SONS Garment',
  } = options;

  // 1. Draw Clean Neutral Studio Backdrop
  const bgGrad = ctx.createRadialGradient(400, 480, 80, 400, 530, 600);
  bgGrad.addColorStop(0, '#fafafc');
  bgGrad.addColorStop(0.6, '#f1f3f7');
  bgGrad.addColorStop(1, '#e4e7ed');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 1060);

  // Subtle floor/studio vignette shadow
  const floorShadow = ctx.createLinearGradient(0, 950, 0, 1060);
  floorShadow.addColorStop(0, 'rgba(0,0,0,0)');
  floorShadow.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = floorShadow;
  ctx.fillRect(0, 950, 800, 110);

  // Soft overall hanging drop shadow behind the entire garment & hanger
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 24;

  // 2. Prepare Fabric Texture/Color
  let texturePattern: CanvasPattern | null = null;
  if (croppedImageUrl) {
    try {
      const cropImg = await loadImg(croppedImageUrl);
      // Sample central fabric texture
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 160;
      sampleCanvas.height = 160;
      const sCtx = sampleCanvas.getContext('2d');
      if (sCtx) {
        // Draw centered sample from the crop
        sCtx.drawImage(
          cropImg,
          cropImg.width * 0.2,
          cropImg.height * 0.2,
          cropImg.width * 0.6,
          cropImg.height * 0.6,
          0,
          0,
          160,
          160
        );
        texturePattern = ctx.createPattern(sampleCanvas, 'repeat');
      }
    } catch (e) {
      console.warn('Could not sample crop texture, using colorHex:', e);
    }
  }

  // 3. Draw The Hanging Garment Body & Sleeves
  const isEthnic = category.includes('Kurta') || category.includes('Ethnic');
  const isJacket = category.includes('Jacket') || category.includes('Blazer') || category.includes('Festive');

  // Garment Coordinates
  const hangerY = 160;
  const shoulderLeftX = 180;
  const shoulderRightX = 620;
  const neckLeftX = 325;
  const neckRightX = 475;
  const hemY = isEthnic ? 930 : isJacket ? 830 : 810;

  // Create Garment Path
  ctx.beginPath();
  // Neck curve (behind collar)
  ctx.moveTo(neckLeftX, hangerY + 15);
  ctx.quadraticCurveTo(400, hangerY + 30, neckRightX, hangerY + 15);

  // Right Shoulder
  ctx.lineTo(shoulderRightX, hangerY + 55);

  // Right Sleeve (Hanging down naturally at side)
  ctx.quadraticCurveTo(shoulderRightX + 25, hangerY + 160, shoulderRightX + 10, hangerY + 380);
  ctx.lineTo(shoulderRightX - 10, hangerY + 490); // cuff
  ctx.lineTo(shoulderRightX - 55, hangerY + 485); // inner cuff
  ctx.quadraticCurveTo(shoulderRightX - 45, hangerY + 320, 560, hangerY + 220); // underarm

  // Right Torso
  ctx.quadraticCurveTo(570, hangerY + 380, 565, hemY - 30);
  ctx.lineTo(560, hemY);

  // Bottom Hem
  if (isEthnic) {
    // Kurta straight hem with subtle curve and side slits
    ctx.lineTo(400, hemY + 5);
    ctx.lineTo(240, hemY);
  } else if (isJacket) {
    // Tailored jacket double vent hem
    ctx.quadraticCurveTo(400, hemY - 10, 240, hemY);
  } else {
    // Modern curved shirt hem
    ctx.quadraticCurveTo(400, hemY + 35, 240, hemY);
  }

  // Left Torso
  ctx.lineTo(235, hemY - 30);
  ctx.quadraticCurveTo(230, hangerY + 380, 240, hangerY + 220); // left underarm

  // Left Sleeve (Hanging down naturally at side)
  ctx.quadraticCurveTo(shoulderLeftX + 45, hangerY + 320, shoulderLeftX + 55, hangerY + 485); // inner cuff
  ctx.lineTo(shoulderLeftX + 10, hangerY + 490); // cuff
  ctx.quadraticCurveTo(shoulderLeftX - 10, hangerY + 380, shoulderLeftX - 25, hangerY + 160);
  ctx.lineTo(shoulderLeftX, hangerY + 55);

  // Back to left neck
  ctx.lineTo(neckLeftX, hangerY + 15);
  ctx.closePath();

  // Fill Base Color
  ctx.fillStyle = colorHex;
  ctx.fill();

  // Overlay real fabric texture if available with subtle multiply
  if (texturePattern) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = texturePattern;
    ctx.fill();
    ctx.restore();
  }

  // 4. Fabric Shading, Lighting, and Natural Vertical Folds
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';

  // Torso depth lighting (center highlight, darker sides)
  const bodyLit = ctx.createLinearGradient(180, 0, 620, 0);
  bodyLit.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
  bodyLit.addColorStop(0.18, 'rgba(0, 0, 0, 0.08)');
  bodyLit.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
  bodyLit.addColorStop(0.82, 'rgba(0, 0, 0, 0.08)');
  bodyLit.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = bodyLit;
  ctx.fill();

  // Vertical fabric drape folds (gives photorealistic soft hanging fabric look)
  const drawFold = (x: number, width: number, depth: number) => {
    const foldGrad = ctx.createLinearGradient(x - width, 0, x + width, 0);
    foldGrad.addColorStop(0, 'rgba(0,0,0,0)');
    foldGrad.addColorStop(0.4, `rgba(0,0,0,${depth})`);
    foldGrad.addColorStop(0.5, `rgba(255,255,255,${depth * 0.7})`);
    foldGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = foldGrad;
    ctx.fillRect(x - width, hangerY + 180, width * 2, hemY - hangerY - 140);
  };

  drawFold(310, 22, 0.18);
  drawFold(355, 18, 0.12);
  drawFold(445, 18, 0.12);
  drawFold(490, 22, 0.18);

  // Sleeve creases
  const drawSleeveShadow = (x: number, y: number, w: number, h: number) => {
    const sGrad = ctx.createLinearGradient(x, y, x + w, y);
    sGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
    sGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
    ctx.fillStyle = sGrad;
    ctx.fillRect(x, y, w, h);
  };
  drawSleeveShadow(165, hangerY + 180, 60, 280);
  drawSleeveShadow(575, hangerY + 180, 60, 280);

  ctx.restore(); // restore shadow & source-atop

  // 5. Center Button Placket
  ctx.save();
  const placketW = 26;
  const placketX = 400 - placketW / 2;
  const placketY = hangerY + 105;
  const placketHeight = isEthnic ? hemY - placketY - 260 : hemY - placketY - 10;

  // Placket base
  ctx.fillStyle = colorHex;
  ctx.fillRect(placketX, placketY, placketW, placketHeight);

  // Placket edge stitch lines and shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(placketX, placketY, placketW, placketHeight);

  // Placket center highlight
  const placketGrad = ctx.createLinearGradient(placketX, 0, placketX + placketW, 0);
  placketGrad.addColorStop(0, 'rgba(0,0,0,0.12)');
  placketGrad.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  placketGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = placketGrad;
  ctx.fillRect(placketX, placketY, placketW, placketHeight);

  // Buttons down the placket
  const buttonCount = isEthnic ? 4 : 6;
  const buttonSpacing = placketHeight / (buttonCount + 1);

  for (let b = 1; b <= buttonCount; b++) {
    const btnY = placketY + b * buttonSpacing;
    // Button drop shadow
    ctx.beginPath();
    ctx.arc(400, btnY + 1, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Mother of pearl / polished button
    ctx.beginPath();
    ctx.arc(400, btnY, 4, 0, Math.PI * 2);
    const btnGrad = ctx.createRadialGradient(399, btnY - 1, 1, 400, btnY, 4);
    if (isJacket) {
      btnGrad.addColorStop(0, '#e5c158');
      btnGrad.addColorStop(0.7, '#926a1c');
      btnGrad.addColorStop(1, '#503808');
    } else {
      btnGrad.addColorStop(0, '#ffffff');
      btnGrad.addColorStop(0.6, '#f3f4f6');
      btnGrad.addColorStop(1, '#cbd5e1');
    }
    ctx.fillStyle = btnGrad;
    ctx.fill();

    // Button thread holes
    ctx.fillStyle = '#64748b';
    ctx.fillRect(398.5, btnY - 1, 1, 1);
    ctx.fillRect(400.5, btnY - 1, 1, 1);
    ctx.fillRect(398.5, btnY + 1, 1, 1);
    ctx.fillRect(400.5, btnY + 1, 1, 1);
  }
  ctx.restore();

  // 6. Chest Pocket (Tailored Finishing)
  if (!isEthnic) {
    ctx.save();
    const pocketX = 300;
    const pocketY = hangerY + 220;
    const pocketW = 54;
    const pocketH = 62;

    // Pocket shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(pocketX, pocketY + 2, pocketW, pocketH);

    // Pocket fabric
    ctx.fillStyle = colorHex;
    ctx.fillRect(pocketX, pocketY, pocketW, pocketH);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pocketX, pocketY, pocketW, pocketH);

    // Top pocket hem stitch
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(pocketX, pocketY + 12);
    ctx.lineTo(pocketX + pocketW, pocketY + 12);
    ctx.stroke();

    // Pocket square for jackets
    if (isJacket) {
      ctx.beginPath();
      ctx.moveTo(pocketX + 15, pocketY);
      ctx.lineTo(pocketX + 27, pocketY - 14);
      ctx.lineTo(pocketX + 38, pocketY);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. Inner Neck & Brand Woven Label (Inside Collar)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(400, hangerY + 70, 65, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fill();

  // Woven Neck Tag
  ctx.fillStyle = '#09090b';
  ctx.fillRect(365, hangerY + 54, 70, 24);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(365, hangerY + 54, 70, 24);

  // Tag Brand Text
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 8px serif';
  ctx.textAlign = 'center';
  ctx.fillText('JSB SONS', 400, hangerY + 66);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '6px sans-serif';
  ctx.fillText('READY 40 (M)', 400, hangerY + 74);
  ctx.restore();

  // 8. Collar Construction (Spread / Cutaway / Mandarin / Bandhgala / Lapel)
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  if (collarStyle.includes('Mandarin') || collarStyle.includes('Nehru') || isEthnic) {
    // Mandarin / Nehru Band Collar
    ctx.beginPath();
    ctx.moveTo(330, hangerY + 40);
    ctx.quadraticCurveTo(400, hangerY + 68, 470, hangerY + 40);
    ctx.lineTo(468, hangerY + 18);
    ctx.quadraticCurveTo(400, hangerY + 45, 332, hangerY + 18);
    ctx.closePath();
    ctx.fillStyle = colorHex;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  } else if (collarStyle.includes('Bandhgala')) {
    // Bandhgala High Neck Collar
    ctx.beginPath();
    ctx.moveTo(332, hangerY + 46);
    ctx.quadraticCurveTo(400, hangerY + 75, 468, hangerY + 46);
    ctx.lineTo(466, hangerY + 12);
    ctx.quadraticCurveTo(400, hangerY + 42, 334, hangerY + 12);
    ctx.closePath();
    ctx.fillStyle = colorHex;
    ctx.fill();
    // Center brass closure hook
    ctx.fillStyle = '#eab308';
    ctx.fillRect(397, hangerY + 38, 6, 8);
  } else if (isJacket) {
    // Tailored Blazer Notch Lapels
    // Left Lapel
    ctx.beginPath();
    ctx.moveTo(335, hangerY + 25);
    ctx.lineTo(290, hangerY + 155);
    ctx.lineTo(330, hangerY + 165);
    ctx.lineTo(390, hangerY + 280);
    ctx.lineTo(390, hangerY + 80);
    ctx.closePath();
    ctx.fillStyle = colorHex;
    ctx.fill();

    // Right Lapel
    ctx.beginPath();
    ctx.moveTo(465, hangerY + 25);
    ctx.lineTo(510, hangerY + 155);
    ctx.lineTo(470, hangerY + 165);
    ctx.lineTo(410, hangerY + 280);
    ctx.lineTo(410, hangerY + 80);
    ctx.closePath();
    ctx.fillStyle = colorHex;
    ctx.fill();
  } else {
    // Classic Spread / Cutaway Shirt Collar
    // Left Collar Wing
    ctx.beginPath();
    ctx.moveTo(340, hangerY + 25);
    ctx.lineTo(315, hangerY + 125);
    ctx.lineTo(385, hangerY + 98);
    ctx.lineTo(380, hangerY + 40);
    ctx.closePath();
    ctx.fillStyle = colorHex;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right Collar Wing
    ctx.beginPath();
    ctx.moveTo(460, hangerY + 25);
    ctx.lineTo(485, hangerY + 125);
    ctx.lineTo(415, hangerY + 98);
    ctx.lineTo(420, hangerY + 40);
    ctx.closePath();
    ctx.fillStyle = colorHex;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // 9. Draw Luxury Wooden Hanger Bar
  ctx.save();
  // Hanger drop shadow onto the garment
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;

  // Solid Polished Dark Walnut Wooden Hanger
  const hangerGrad = ctx.createLinearGradient(0, hangerY - 20, 0, hangerY + 45);
  hangerGrad.addColorStop(0, '#5a3d28');
  hangerGrad.addColorStop(0.3, '#3e2718');
  hangerGrad.addColorStop(0.7, '#24140b');
  hangerGrad.addColorStop(1, '#150a04');

  ctx.beginPath();
  // Center neck peak
  ctx.moveTo(400, hangerY - 22);
  // Right slope down to shoulder
  ctx.quadraticCurveTo(530, hangerY - 8, 635, hangerY + 48);
  ctx.quadraticCurveTo(645, hangerY + 62, 630, hangerY + 68);
  ctx.lineTo(605, hangerY + 62);
  // Underside of right hanger arm
  ctx.quadraticCurveTo(510, hangerY + 15, 400, hangerY + 16);
  // Underside of left hanger arm
  ctx.quadraticCurveTo(290, hangerY + 15, 195, hangerY + 62);
  ctx.lineTo(170, hangerY + 68);
  ctx.quadraticCurveTo(155, hangerY + 62, 165, hangerY + 48);
  // Left slope up to peak
  ctx.quadraticCurveTo(270, hangerY - 8, 400, hangerY - 22);
  ctx.closePath();

  ctx.fillStyle = hangerGrad;
  ctx.fill();

  // Top wood edge highlight
  ctx.strokeStyle = 'rgba(217, 163, 107, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Polished Wood Grain Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(220, hangerY + 28);
  ctx.quadraticCurveTo(400, hangerY - 6, 580, hangerY + 28);
  ctx.stroke();

  // Laser Engraved Golden Logo on Hanger Center
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 9px serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('JSB SONS', 400, hangerY + 1);

  ctx.restore();

  // 10. Golden Brass Curved Hanger Hook
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;

  // Brass mounting ferrule at hanger base
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(395, hangerY - 28, 10, 8);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(395, hangerY - 28, 10, 8);

  // Hook curve
  ctx.beginPath();
  ctx.moveTo(400, hangerY - 26);
  ctx.lineTo(400, hangerY - 75);
  ctx.quadraticCurveTo(400, hangerY - 125, 435, hangerY - 125);
  ctx.quadraticCurveTo(465, hangerY - 125, 465, hangerY - 95);
  ctx.quadraticCurveTo(465, hangerY - 78, 450, hangerY - 78);

  const hookGrad = ctx.createLinearGradient(390, hangerY - 130, 470, hangerY - 25);
  hookGrad.addColorStop(0, '#fef08a');
  hookGrad.addColorStop(0.35, '#eab308');
  hookGrad.addColorStop(0.7, '#a16207');
  hookGrad.addColorStop(1, '#ca8a04');

  ctx.strokeStyle = hookGrad;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Hook metallic specular highlight
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();

  // 11. Subtle Studio Watermark / Seal in Lower Corner
  ctx.save();
  ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
  ctx.font = '500 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('JSB SONS · READY GARMENTS CATALOG', 40, 1025);

  ctx.textAlign = 'right';
  ctx.fillText(`${fabric} · Full Hanging Form`, 760, 1025);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.94);
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
