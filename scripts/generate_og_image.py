import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_pixel_hand(scale=3):
    bitmap = [
        "      ##        ",
        "     #..#       ",
        "     #..#       ",
        "     #..#       ",
        "     #..#       ",
        "     #..####    ",
        "     #..#..#    ",
        "  ####..#..#### ",
        " #..##..#..#..# ",
        "#...##..#..#..# ",
        "#....#........# ",
        " #............# ",
        "  #...........# ",
        "  #..........#  ",
        "   #........#   ",
        "   #........#   ",
        "    ########    ",
    ]
    rows = len(bitmap)
    cols = len(bitmap[0])
    hand_img = Image.new("RGBA", (cols * scale, rows * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(hand_img)
    
    for r, row in enumerate(bitmap):
        for c, ch in enumerate(row):
            if ch == "#":
                draw.rectangle([c * scale, r * scale, (c + 1) * scale - 1, (r + 1) * scale - 1], fill=(15, 23, 20, 255))
            elif ch == ".":
                draw.rectangle([c * scale, r * scale, (c + 1) * scale - 1, (r + 1) * scale - 1], fill=(255, 255, 255, 255))
                
    return hand_img

def draw_tide_crest(draw, x, y, pixel_size=5, fill_color=(255, 255, 255, 255), shadow_color=(255, 255, 255, 90)):
    main_coords = [
        (4, 16), (8, 12), (12, 8), (16, 4), (20, 4), (20, 8), (16, 12)
    ]
    shadow_coords = [
        (8, 16), (12, 12), (8, 20)
    ]
    
    scale = pixel_size / 4.0
    for sx, sy in shadow_coords:
        px = x + int(sx * scale)
        py = y + int(sy * scale)
        pw = int(4 * scale)
        draw.rectangle([px, py, px + pw - 1, py + pw - 1], fill=shadow_color)
        
    for mx, my in main_coords:
        px = x + int(mx * scale)
        py = y + int(my * scale)
        pw = int(4 * scale)
        draw.rectangle([px, py, px + pw - 1, py + pw - 1], fill=fill_color)

def generate_og_image(output_path, pill_word="yield", width=1200, height=630):
    bg_color = (43, 73, 61) # Deep forest pine #2b493d matching reference
    
    base = Image.new("RGBA", (width, height), bg_color)
    draw = ImageDraw.Draw(base)
    
    font_med_headline = ImageFont.truetype("/Users/user/tide/public/fonts/NeueMontreal-Medium.otf", 78)
    font_pill = ImageFont.truetype("/Users/user/tide/public/fonts/NeueMontreal-Medium.otf", 66)
    font_brand = ImageFont.truetype("/Users/user/tide/public/fonts/NeueMontreal-Medium.otf", 34)
    font_sub = ImageFont.truetype("/Users/user/tide/public/fonts/NeueMontreal-Regular.otf", 18)
    font_footer = ImageFont.truetype("/Users/user/tide/public/fonts/NeueMontreal-Regular.otf", 17)
    font_badge = ImageFont.truetype("/Users/user/tide/public/fonts/NeueMontreal-Medium.otf", 16)
    
    # 1. Top Header
    draw_tide_crest(draw, 70, 52, pixel_size=6, fill_color=(255, 255, 255, 255), shadow_color=(255, 255, 255, 90))
    draw.text((125, 54), "Tide", fill=(255, 255, 255, 255), font=font_brand)
    draw.text((205, 68), "Nimiq Pay", fill=(170, 195, 185, 255), font=font_sub)
    
    badge_text = "Non custodial yield"
    badge_box = font_badge.getbbox(badge_text)
    badge_w = badge_box[2] - badge_box[0]
    badge_x = width - 70 - badge_w - 32
    badge_y = 54
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w + 32, badge_y + 40], radius=20, fill=(35, 60, 50, 180), outline=(75, 105, 92, 200), width=1)
    draw.text((badge_x + 16, badge_y + 10), badge_text, fill=(220, 235, 230, 255), font=font_badge)
    
    # 2. Headline with Tilted Pill
    text_left = "Put "
    text_right = " to work."
    
    left_bbox = font_med_headline.getbbox(text_left)
    left_w = left_bbox[2] - left_bbox[0]
    
    right_bbox = font_med_headline.getbbox(text_right)
    right_w = right_bbox[2] - right_bbox[0]
    
    pill_text_bbox = font_pill.getbbox(pill_word)
    pill_text_w = pill_text_bbox[2] - pill_text_bbox[0]
    pill_text_h = pill_text_bbox[3] - pill_text_bbox[1]
    
    pill_w = pill_text_w + 160
    pill_h = 96
    
    pill_canvas = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
    pill_draw = ImageDraw.Draw(pill_canvas)
    
    pill_color = (213, 228, 223, 255) # Light sage #d5e4df
    pill_draw.rounded_rectangle([0, 0, pill_w, pill_h], radius=pill_h // 2, fill=pill_color)
    
    dot_radius = 8
    dot_color = (38, 64, 53, 255)
    pill_draw.ellipse([32, pill_h // 2 - dot_radius, 32 + dot_radius * 2, pill_h // 2 + dot_radius], fill=dot_color)
    pill_draw.ellipse([pill_w - 32 - dot_radius * 2, pill_h // 2 - dot_radius, pill_w - 32, pill_h // 2 + dot_radius], fill=dot_color)
    
    text_x = (pill_w - pill_text_w) // 2
    text_y = (pill_h - pill_text_h) // 2 - pill_text_bbox[1] - 4
    pill_draw.text((text_x, text_y), pill_word, fill=(28, 48, 40, 255), font=font_pill)
    
    angle = -9.5
    pill_rot = pill_canvas.rotate(-angle, expand=True, resample=Image.BICUBIC)
    
    shadow_pad = 60
    shadow_canvas = Image.new("RGBA", (pill_w + shadow_pad * 2, pill_h + shadow_pad * 2), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_canvas)
    shadow_draw.rounded_rectangle([shadow_pad, shadow_pad, shadow_pad + pill_w, shadow_pad + pill_h], radius=pill_h // 2, fill=(15, 28, 22, 160))
    shadow_blur = shadow_canvas.filter(ImageFilter.GaussianBlur(16))
    shadow_rot = shadow_blur.rotate(-angle, expand=True, resample=Image.BICUBIC)
    
    rad = math.radians(abs(angle))
    eff_pill_w = pill_w * math.cos(rad) + pill_h * math.sin(rad)
    
    total_w = left_w + eff_pill_w + right_w + 10
    start_x = (width - total_w) // 2
    baseline_y = 310
    
    left_x = start_x
    left_y = baseline_y - left_bbox[3]
    draw.text((left_x, left_y), text_left, fill=(255, 255, 255, 255), font=font_med_headline)
    
    pill_center_x = left_x + left_w + eff_pill_w // 2 + 5
    pill_center_y = baseline_y - 20
    
    s_x = pill_center_x - shadow_rot.width // 2 + 6
    s_y = pill_center_y - shadow_rot.height // 2 + 20
    base.alpha_composite(shadow_rot, (int(s_x), int(s_y)))
    
    p_x = pill_center_x - pill_rot.width // 2
    p_y = pill_center_y - pill_rot.height // 2
    base.alpha_composite(pill_rot, (int(p_x), int(p_y)))
    
    hand = create_pixel_hand(scale=3)
    hand_x = pill_center_x - hand.width // 2 - 20
    hand_y = pill_center_y + pill_h // 2 - 16
    base.alpha_composite(hand, (int(hand_x), int(hand_y)))
    
    right_x = left_x + left_w + eff_pill_w + 15
    right_y = baseline_y - right_bbox[3]
    draw.text((right_x, right_y), text_right, fill=(255, 255, 255, 255), font=font_med_headline)
    
    sub_text = "Nimiq Proof of Stake / Polygon USDT Lending / Self Custodial"
    sub_bbox = font_sub.getbbox(sub_text)
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((width - sub_w) // 2, baseline_y + 115), sub_text, fill=(175, 202, 192, 230), font=font_sub)
    
    footer_left = "Real net yields computed after network costs"
    footer_right = "app-tide.pages.dev"
    
    draw.text((70, height - 60), footer_left, fill=(145, 175, 163, 200), font=font_footer)
    f_r_bbox = font_footer.getbbox(footer_right)
    draw.text((width - 70 - (f_r_bbox[2] - f_r_bbox[0]), height - 60), footer_right, fill=(145, 175, 163, 200), font=font_footer)
    
    final_rgb = Image.new("RGB", (width, height), bg_color)
    final_rgb.paste(base, mask=base.split()[3])
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_rgb.save(output_path, "PNG", quality=95)
    print(f"Saved OG Image to {output_path}")

if __name__ == "__main__":
    generate_og_image("/Users/user/tide/public/og-image.png", pill_word="yield")
    generate_og_image("/Users/user/tide/public/og.png", pill_word="yield")
    generate_og_image("/Users/user/tide/public/twitter-image.png", pill_word="yield")

