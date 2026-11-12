#!/usr/bin/env python3
"""
JSB SONS - AI Virtual Model & Mannequin Try-On Studio Engine
Generates an imaginary model or luxury tailor mannequin wearing the uploaded garment
using the Gemini API key from environment variables, with a smart high-fidelity
Pillow composite fallback for quota-resilience.
"""

import sys
import os
import json
import base64
import re
from io import BytesIO
from urllib import request, error

# Ensure Pillow is available for high-res fallback & image manipulation
try:
    from PIL import Image, ImageDraw, ImageFilter, ImageOps
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False


def load_env_gemini_key():
    """Reads GEMINI_API_KEY from environment or .env file."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if key and key != "your-secure-admin-password":
        return key

    # Search for .env in current and parent directories
    candidate_paths = [
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
    ]
    for env_path in candidate_paths:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("GEMINI_API_KEY=") and not line.startswith("#"):
                            val = line.split("=", 1)[1].strip().strip('"').strip("'")
                            if val:
                                return val
            except Exception:
                pass
    return ""


def parse_color_hex(hex_str, default=(30, 58, 138)):
    """Safely converts hex string (#1e3a8a) to RGB tuple."""
    if not hex_str or not isinstance(hex_str, str):
        return default
    clean = hex_str.strip().lstrip("#")
    if len(clean) == 3:
        clean = "".join([c * 2 for c in clean])
    if len(clean) == 6:
        try:
            return (int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16))
        except ValueError:
            pass
    return default


def call_gemini_generate_image(api_key, title, category, color, fabric, model_type, input_img_base64=None):
    """
    Attempts photorealistic AI image generation via Google Gemini Image models.
    Returns (success, base64_image_url, message_or_error)
    """
    if not api_key:
        return False, None, "GEMINI_API_KEY not configured"

    # Construct tailor-made studio prompt based on requested model style
    if model_type == "model-male":
        subject_desc = (
            "an imaginary professional male fashion model with athletic tailored build, "
            "standing in a minimalist high-fashion studio, confident editorial posture"
        )
    elif model_type == "model-female":
        subject_desc = (
            "an imaginary professional female fashion model with elegant tailored posture, "
            "standing in a clean minimalist fashion lookbook studio"
        )
    elif model_type == "ghost-mannequin":
        subject_desc = (
            "a 3D invisible ghost mannequin showing full three-dimensional garment volume, "
            "floating neatly with interior back-collar depth visible"
        )
    else:  # default 'mannequin'
        subject_desc = (
            "a luxury bespoke tailor mannequin with polished brass neck finial, "
            "brushed champagne bronze stand, and tailored ivory linen torso"
        )

    prompt = (
        f"Studio catalog fashion lookbook photograph for JSB SONS Ready Garments. "
        f"Featuring {subject_desc} wearing the garment: '{title}'. "
        f"Garment category: {category}. Primary color: {color}. Fabric texture: {fabric}. "
        f"Crisp clean collar, naturally draped sleeves, immaculate seams and buttons, "
        f"flattering garment fit, soft diffused commercial studio lighting on a neutral ivory background, "
        f"subtle floor contact shadow, professional e-commerce product photography, 8k resolution."
    )

    # Models to query in order of preference
    models_to_try = [
        "gemini-2.5-flash-image",
        "gemini-3.1-flash-image",
        "gemini-3.1-flash-lite-image",
    ]

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        parts = [{"text": prompt}]

        if input_img_base64:
            clean_b64 = re.sub(r"^data:image\/[a-zA-Z0-9+.-]+;base64,", "", input_img_base64)
            parts.append({
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": clean_b64
                }
            })

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "imageConfig": {
                    "aspectRatio": "3:4"
                }
            }
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
            with request.urlopen(req, timeout=6) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                candidates = res_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for p in parts:
                        inline = p.get("inlineData", {})
                        if inline.get("data"):
                            mime = inline.get("mimeType", "image/png")
                            return True, f"data:{mime};base64,{inline['data']}", f"Generated with Gemini ({model_name})"
        except error.HTTPError as e:
            # If 429 quota exceeded or 404, try next or fallback
            err_body = e.read().decode("utf-8", errors="ignore")
            # Continue to try next candidate model or fallback to procedural studio
            continue
        except Exception:
            continue

    return False, None, "Gemini image quota exceeded or unavailable. Procedural studio engine activated."


def generate_procedural_tryon_studio(raw_image_data, title, category, color_name, color_hex, fabric, model_type):
    """
    High-fidelity procedural studio composite engine using Pillow.
    Creates a photorealistic luxury mannequin or imaginary model try-on display
    wearing the uploaded garment with realistic shadows, neck cap, and pedestal.
    """
    if not PILLOW_AVAILABLE:
        # Fallback to raw image if Pillow not present
        return raw_image_data if raw_image_data else ""

    W, H = 900, 1200
    base_color_rgb = parse_color_hex(color_hex, (40, 70, 140))

    # 1. Create luxury soft studio background with subtle radial gradient
    canvas = Image.new("RGBA", (W, H), (248, 249, 251, 255))
    draw = ImageDraw.Draw(canvas)

    # Gradient background: Soft off-white to studio cool grey vignette
    for r in range(H):
        ratio = r / float(H)
        c = int(248 - ratio * 18)
        draw.line([(0, r), (W, r)], fill=(c, c, int(c + 2), 255))

    # Studio spot light glow in center
    spot = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    spot_draw = ImageDraw.Draw(spot)
    spot_draw.ellipse(
        [W // 2 - 360, H // 2 - 420, W // 2 + 360, H // 2 + 420],
        fill=(255, 255, 255, 75)
    )
    spot = spot.filter(ImageFilter.GaussianBlur(100))
    canvas = Image.alpha_composite(canvas, spot)

    # 2. Draw Floor Contact Shadow (soft oval ellipse at pedestal base)
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_draw.ellipse(
        [W // 2 - 240, H - 160, W // 2 + 240, H - 100],
        fill=(30, 35, 45, 90)
    )
    shadow_draw.ellipse(
        [W // 2 - 160, H - 148, W // 2 + 160, H - 112],
        fill=(15, 20, 30, 130)
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(26))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    # 3. Render Model / Mannequin Foundation
    mannequin_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(mannequin_layer)

    cx = W // 2

    if model_type == "ghost-mannequin":
        # Ghost Mannequin: 3D hollow collar inner depth
        neck_dark_rgb = (max(0, base_color_rgb[0] - 50), max(0, base_color_rgb[1] - 50), max(0, base_color_rgb[2] - 50))
        m_draw.ellipse([cx - 90, 240, cx + 90, 340], fill=(*neck_dark_rgb, 255))
        # Inner collar shadow
        m_draw.ellipse([cx - 80, 250, cx + 80, 330], fill=(20, 20, 25, 180))

    elif model_type in ["model-male", "model-female"]:
        # Imaginary Fashion Model Silhouette & Neck
        skin_rgb = (235, 205, 185) if model_type == "model-female" else (220, 190, 170)
        neck_top = 180
        # Head / Neck silhouette with soft editorial styling
        m_draw.polygon([
            (cx - 50, neck_top + 10),
            (cx + 50, neck_top + 10),
            (cx + 65, 340),
            (cx + 170, 375),
            (cx - 170, 375),
            (cx - 65, 340)
        ], fill=(*skin_rgb, 255))
        # Collarbone depth shading
        m_draw.arc([cx - 70, 310, cx + 70, 350], start=0, end=180, fill=(180, 150, 130, 160), width=3)

    else:
        # Luxury Tailor Mannequin (Ivory Linen Form with Brass Finial & Stand)
        # Chrome/Bronze Base Stand at bottom
        m_draw.rectangle([cx - 14, H - 280, cx + 14, H - 120], fill=(160, 135, 80, 255)) # Polished Brass pole
        m_draw.ellipse([cx - 110, H - 140, cx + 110, H - 115], fill=(185, 155, 95, 255)) # Heavy circular base

        # Linen Torso shape
        torso_pts = [
            (cx - 65, 270),
            (cx + 65, 270),
            (cx + 195, 380),
            (cx + 160, 780),
            (cx - 160, 780),
            (cx - 195, 380),
        ]
        m_draw.polygon(torso_pts, fill=(238, 233, 222, 255)) # Ivory Linen texture

        # Elegant Polished Brass Neck Cap (Finial)
        m_draw.ellipse([cx - 62, 240, cx + 62, 285], fill=(212, 175, 95, 255))
        m_draw.ellipse([cx - 48, 225, cx + 48, 260], fill=(235, 200, 115, 255))
        m_draw.ellipse([cx - 26, 205, cx + 26, 235], fill=(250, 220, 135, 255)) # Top dome

        # Mannequin wooden side arm joint cutouts
        m_draw.ellipse([cx - 205, 370, cx - 165, 470], fill=(165, 120, 75, 255))
        m_draw.ellipse([cx + 165, 370, cx + 205, 470], fill=(165, 120, 75, 255))

    canvas = Image.alpha_composite(canvas, mannequin_layer)

    # 4. Composite Uploaded Garment Over Mannequin Form
    if raw_image_data:
        try:
            # Decode clean image
            clean_b64 = re.sub(r"^data:image\/[a-zA-Z0-9+.-]+;base64,", "", raw_image_data)
            garment_bytes = base64.b64decode(clean_b64)
            garment_img = Image.open(BytesIO(garment_bytes)).convert("RGBA")

            # Calculate appropriate display scale for garment on mannequin
            gw, gh = garment_img.size
            target_w = int(W * 0.74)
            target_h = int(target_w * (gh / float(gw)))

            # Cap height to maintain mannequin proportions
            if target_h > int(H * 0.65):
                target_h = int(H * 0.65)
                target_w = int(target_h * (gw / float(gh)))

            resized_garment = garment_img.resize((target_w, target_h), Image.Resampling.LANCZOS)

            # Create garment drop shadow on mannequin
            g_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            pos_x = cx - (target_w // 2)
            pos_y = 310 # Align neatly with mannequin shoulders

            # Shadow mask from garment alpha
            if "A" in resized_garment.getbands():
                alpha_mask = resized_garment.split()[3]
                shadow_color = Image.new("RGBA", (target_w, target_h), (20, 25, 35, 85))
                g_shadow.paste(shadow_color, (pos_x + 6, pos_y + 12), alpha_mask)
                g_shadow = g_shadow.filter(ImageFilter.GaussianBlur(14))
                canvas = Image.alpha_composite(canvas, g_shadow)

            # Paste garment onto canvas
            if "A" in resized_garment.getbands():
                canvas.paste(resized_garment, (pos_x, pos_y), resized_garment.split()[3])
            else:
                canvas.paste(resized_garment, (pos_x, pos_y))

        except Exception as err:
            # If compositing fails, continue with baseline rendering
            pass

    # 5. Add Luxury Studio Watermark & Info Pill
    ui_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui_draw = ImageDraw.Draw(ui_layer)

    # Top Brand Tag
    ui_draw.rounded_rectangle([32, 32, 280, 76], radius=8, fill=(15, 23, 42, 220))
    ui_draw.text((46, 42), "JSB SONS VIRTUAL STUDIO", fill=(251, 191, 36, 255)) # Amber gold
    ui_draw.text((46, 58), f"{model_type.upper().replace('-', ' ')} TRY-ON", fill=(203, 213, 225, 255))

    # Bottom Fabric & Fit Badge
    badge_text = f"{color_name} · {category} · {fabric}"
    ui_draw.rounded_rectangle([32, H - 64, W - 32, H - 28], radius=6, fill=(24, 24, 27, 190))
    ui_draw.text((46, H - 52), badge_text[:75], fill=(244, 244, 245, 255))

    canvas = Image.alpha_composite(canvas, ui_layer)

    # Convert to high-quality JPEG Base64 Data URL
    buffered = BytesIO()
    canvas.convert("RGB").save(buffered, format="JPEG", quality=92, optimize=True)
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{img_b64}"


def main():
    """Main execution entry point."""
    # Read payload from stdin if explicitly requested (--stdin), otherwise parse arguments
    input_data = {}
    if "--stdin" in sys.argv:
        try:
            raw_input = sys.stdin.read().strip()
            if raw_input:
                input_data = json.loads(raw_input)
        except Exception:
            pass

    # Parse arguments (skipping flags like --stdin)
    cli_args = [a for a in sys.argv[1:] if not a.startswith("--")]
    image_base64 = input_data.get("imageBase64") or (cli_args[0] if len(cli_args) > 0 else "")
    title = input_data.get("title") or (cli_args[1] if len(cli_args) > 1 else "Ready Garment")
    category = input_data.get("category") or (cli_args[2] if len(cli_args) > 2 else "Garments")
    color = input_data.get("color") or (cli_args[3] if len(cli_args) > 3 else "Navy Blue")
    color_hex = input_data.get("colorHex") or (cli_args[4] if len(cli_args) > 4 else "#1e3a8a")
    fabric = input_data.get("fabric") or (cli_args[5] if len(cli_args) > 5 else "Pure Cotton")
    model_type = input_data.get("modelType") or (cli_args[6] if len(cli_args) > 6 else "mannequin")

    api_key = load_env_gemini_key()

    # Step 1: Attempt Gemini AI model generation first
    success, gemini_img_url, status_msg = call_gemini_generate_image(
        api_key=api_key,
        title=title,
        category=category,
        color=color,
        fabric=fabric,
        model_type=model_type,
        input_img_base64=image_base64
    )

    if success and gemini_img_url:
        result = {
            "success": True,
            "imageUrl": gemini_img_url,
            "engine": "gemini",
            "modelType": model_type,
            "status": status_msg
        }
    else:
        # Step 2: Use intelligent Procedural Studio Engine (Pillow)
        studio_img_url = generate_procedural_tryon_studio(
            raw_image_data=image_base64,
            title=title,
            category=category,
            color_name=color,
            color_hex=color_hex,
            fabric=fabric,
            model_type=model_type
        )
        result = {
            "success": True,
            "imageUrl": studio_img_url,
            "engine": "procedural-studio",
            "modelType": model_type,
            "status": "Rendered with JSB SONS Virtual Studio Engine" if studio_img_url else status_msg
        }

    # Output clean JSON to stdout for Node/Express
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
