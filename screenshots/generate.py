#!/usr/bin/env python3
"""Generate 5 Chrome Web Store promotional screenshots for FillFaker."""

from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1280, 800
BG = "#1a1a1a"
TEAL = "#4ecdc4"
WHITE = "#ffffff"
GRAY = "#888888"
LIGHT_GRAY = "#cccccc"
DARK_CARD = "#252525"
DARKER = "#111111"
FIELD_BG = "#2a2a2a"
BORDER_GRAY = "#444444"

OUT = "/Volumes/Liam's first SSD 2TB/work/chrome-extensions/fillfaker/screenshots"

def load_fonts():
    """Load fonts at various sizes."""
    fonts = {}
    try:
        base = "/System/Library/Fonts/Helvetica.ttc"
        fonts["hero"] = ImageFont.truetype(base, 52, index=1)    # Bold
        fonts["h1"] = ImageFont.truetype(base, 44, index=1)
        fonts["h2"] = ImageFont.truetype(base, 32, index=1)
        fonts["h3"] = ImageFont.truetype(base, 24, index=1)
        fonts["body"] = ImageFont.truetype(base, 20)
        fonts["body_bold"] = ImageFont.truetype(base, 20, index=1)
        fonts["small"] = ImageFont.truetype(base, 16)
        fonts["small_bold"] = ImageFont.truetype(base, 16, index=1)
        fonts["tiny"] = ImageFont.truetype(base, 13)
        fonts["key"] = ImageFont.truetype(base, 18, index=1)
        fonts["logo"] = ImageFont.truetype(base, 22, index=1)
        fonts["badge"] = ImageFont.truetype(base, 17, index=1)
        fonts["subtitle"] = ImageFont.truetype(base, 22)
        fonts["big_num"] = ImageFont.truetype(base, 72, index=1)
        fonts["label"] = ImageFont.truetype(base, 14)
        fonts["field"] = ImageFont.truetype(base, 17)
        fonts["form_title"] = ImageFont.truetype(base, 20, index=1)
    except Exception:
        f = ImageFont.load_default()
        for k in ["hero","h1","h2","h3","body","body_bold","small","small_bold",
                   "tiny","key","logo","badge","subtitle","big_num","label","field","form_title"]:
            fonts[k] = f
    return fonts

F = load_fonts()


def new_img():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = xy
    r = radius
    if fill:
        draw.rectangle([x0+r, y0, x1-r, y1], fill=fill)
        draw.rectangle([x0, y0+r, x1, y1-r], fill=fill)
        draw.pieslice([x0, y0, x0+2*r, y0+2*r], 180, 270, fill=fill)
        draw.pieslice([x1-2*r, y0, x1, y0+2*r], 270, 360, fill=fill)
        draw.pieslice([x0, y1-2*r, x0+2*r, y1], 90, 180, fill=fill)
        draw.pieslice([x1-2*r, y1-2*r, x1, y1], 0, 90, fill=fill)
    if outline:
        draw.arc([x0, y0, x0+2*r, y0+2*r], 180, 270, fill=outline, width=width)
        draw.arc([x1-2*r, y0, x1, y0+2*r], 270, 360, fill=outline, width=width)
        draw.arc([x0, y1-2*r, x0+2*r, y1], 90, 180, fill=outline, width=width)
        draw.arc([x1-2*r, y1-2*r, x1, y1], 0, 90, fill=outline, width=width)
        draw.line([x0+r, y0, x1-r, y0], fill=outline, width=width)
        draw.line([x0+r, y1, x1-r, y1], fill=outline, width=width)
        draw.line([x0, y0+r, x0, y1-r], fill=outline, width=width)
        draw.line([x1, y0+r, x1, y1-r], fill=outline, width=width)


def draw_logo(draw, x, y):
    """Draw FillFaker logo mark + text."""
    # Simple "FF" mark in teal box
    draw_rounded_rect(draw, [x, y, x+36, y+36], 6, fill=TEAL)
    draw.text((x+5, y+4), "FF", fill=DARKER, font=F["key"])
    draw.text((x+44, y+6), "FillFaker", fill=WHITE, font=F["logo"])


def draw_checkmark(draw, cx, cy, size, color=TEAL, width=3):
    """Draw a checkmark centered at (cx, cy)."""
    s = size
    points = [
        (cx - s*0.4, cy),
        (cx - s*0.1, cy + s*0.35),
        (cx + s*0.45, cy - s*0.3)
    ]
    draw.line([points[0], points[1]], fill=color, width=width)
    draw.line([points[1], points[2]], fill=color, width=width)


# ─── Screenshot 1: Hero ───
def make_hero():
    img, draw = new_img()

    # Right side: headline area
    draw.text((660, 80), "One Click.", fill=WHITE, font=F["hero"])
    draw.text((660, 145), "All Fields Filled.", fill=TEAL, font=F["hero"])
    draw.text((660, 220), "Consistent fake data — name, email, phone", fill=GRAY, font=F["body"])
    draw.text((660, 246), "all match the same person.", fill=GRAY, font=F["body"])

    # Left side: mock form card
    form_x, form_y = 60, 100
    form_w, form_h = 520, 580
    draw_rounded_rect(draw, [form_x, form_y, form_x+form_w, form_y+form_h], 16, fill=DARK_CARD)

    # Form header
    draw.text((form_x+30, form_y+24), "Create Account", fill=WHITE, font=F["form_title"])
    draw.line([(form_x+30, form_y+60), (form_x+form_w-30, form_y+60)], fill=BORDER_GRAY, width=1)

    # Form fields
    fields = [
        ("First Name", "Sarah"),
        ("Last Name", "Johnson"),
        ("Email", "sarah.johnson@mailtest.com"),
        ("Phone", "+1 (555) 847-2391"),
        ("Password", "Kx9#mP2$vL7n"),
    ]

    fy = form_y + 80
    for label_text, value in fields:
        # Label
        draw.text((form_x+30, fy), label_text, fill=GRAY, font=F["label"])
        fy += 20
        # Input field with teal border (filled state)
        fx0, fy0 = form_x+30, fy
        fx1, fy1 = form_x+form_w-30, fy+42
        draw_rounded_rect(draw, [fx0, fy0, fx1, fy1], 6, fill=FIELD_BG, outline=TEAL, width=2)
        # Value text
        display = value if label_text != "Password" else "\u2022" * 12
        draw.text((fx0+12, fy0+10), display if label_text != "Password" else value, fill=WHITE, font=F["field"])
        fy += 56

    # "Sign Up" button
    btn_y = fy + 10
    draw_rounded_rect(draw, [form_x+30, btn_y, form_x+form_w-30, btn_y+44], 8, fill=TEAL)
    bw = draw.textlength("Sign Up", font=F["body_bold"])
    draw.text((form_x + form_w//2 - bw//2, btn_y+10), "Sign Up", fill=DARKER, font=F["body_bold"])

    # Right side: feature bullets
    bullets = [
        "Realistic names & emails",
        "Matching phone numbers",
        "Strong passwords generated",
        "Works on any website",
    ]
    by = 320
    for b in bullets:
        draw_checkmark(draw, 680, by+10, 12, TEAL, 3)
        draw.text((705, by), b, fill=LIGHT_GRAY, font=F["body"])
        by += 40

    # Logo bottom right
    draw_logo(draw, W-220, H-50)

    img.save(f"{OUT}/screenshot-hero.png")
    print("  screenshot-hero.png")


# ─── Screenshot 2: Smart Detection ───
def make_smart_detect():
    img, draw = new_img()

    # Headline
    t = "Smart 8-Signal Detection"
    tw = draw.textlength(t, font=F["h1"])
    draw.text(((W-tw)//2, 50), t, fill=WHITE, font=F["h1"])

    sub = "Detects field types using 8 different signals. More signals = fewer missed fields."
    sw = draw.textlength(sub, font=F["body"])
    draw.text(((W-sw)//2, 110), sub, fill=GRAY, font=F["body"])

    # Center circle with "8"
    cx, cy = W//2, H//2 + 20
    r = 70
    # Draw circle outline
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=TEAL, width=3)
    nw = draw.textlength("8", font=F["big_num"])
    draw.text((cx - nw//2, cy - 44), "8", fill=TEAL, font=F["big_num"])
    sw2 = draw.textlength("Signals", font=F["small_bold"])
    draw.text((cx - sw2//2, cy + 28), "Signals", fill=GRAY, font=F["small_bold"])

    # 8 signals arranged in a circle
    signals = ["type", "autocomplete", "name", "id", "class", "placeholder", "label", "aria-label"]
    orbit_r = 220
    for i, sig in enumerate(signals):
        angle = (i / 8) * 2 * math.pi - math.pi/2
        sx = cx + orbit_r * math.cos(angle)
        sy = cy + orbit_r * math.sin(angle)

        # Badge
        stw = draw.textlength(sig, font=F["badge"])
        bw = stw + 28
        bh = 38
        draw_rounded_rect(draw, [sx-bw//2, sy-bh//2, sx+bw//2, sy+bh//2], 8, fill="#1a3a38", outline=TEAL, width=2)
        draw.text((sx - stw//2, sy - 10), sig, fill=TEAL, font=F["badge"])

        # Connecting line to center
        # Shorten line so it doesn't overlap badge or circle
        line_start_r = r + 8
        line_end_r = orbit_r - bw//2 - 8
        lx0 = cx + line_start_r * math.cos(angle)
        ly0 = cy + line_start_r * math.sin(angle)
        lx1 = cx + line_end_r * math.cos(angle)
        ly1 = cy + line_end_r * math.sin(angle)
        draw.line([(lx0, ly0), (lx1, ly1)], fill="#335553", width=1)

    # Bottom example
    ex_y = H - 120
    ex_text = 'Example:  <input type="email" name="user_email" placeholder="Enter email">'
    etw = draw.textlength(ex_text, font=F["small"])
    draw_rounded_rect(draw, [(W-etw)//2-20, ex_y-8, (W+etw)//2+20, ex_y+28], 6, fill=DARK_CARD)
    draw.text(((W-etw)//2, ex_y), ex_text, fill="#aaa", font=F["small"])
    draw.text(((W-etw)//2 - 2, ex_y + 30), "3 signals matched  \u2192  email field detected with high confidence", fill=TEAL, font=F["small"])

    draw_logo(draw, W-220, H-50)
    img.save(f"{OUT}/screenshot-smart-detect.png")
    print("  screenshot-smart-detect.png")


# ─── Screenshot 3: Framework Compatibility ───
def make_framework():
    img, draw = new_img()

    t = "Framework Compatible"
    tw = draw.textlength(t, font=F["h1"])
    draw.text(((W-tw)//2, 60), t, fill=WHITE, font=F["h1"])

    sub = 'Native property setters + complete event chain.'
    sw = draw.textlength(sub, font=F["body"])
    draw.text(((W-sw)//2, 120), sub, fill=GRAY, font=F["body"])
    sub2 = 'No more "filled but form thinks it\'s empty".'
    sw2 = draw.textlength(sub2, font=F["body"])
    draw.text(((W-sw2)//2, 148), sub2, fill=GRAY, font=F["body"])

    # Framework boxes in a row
    frameworks = ["React", "Vue", "Angular", "Material UI", "Shadow DOM"]
    box_w = 180
    box_h = 180
    gap = 30
    total_w = len(frameworks) * box_w + (len(frameworks)-1) * gap
    start_x = (W - total_w) // 2
    row_y = 240

    for i, fw in enumerate(frameworks):
        x = start_x + i * (box_w + gap)
        y = row_y
        draw_rounded_rect(draw, [x, y, x+box_w, y+box_h], 12, fill=DARK_CARD, outline=BORDER_GRAY, width=1)

        # Checkmark icon
        draw_checkmark(draw, x + box_w//2, y + 60, 28, TEAL, 4)

        # Framework name
        ftw = draw.textlength(fw, font=F["h3"])
        draw.text((x + (box_w-ftw)//2, y + 110), fw, fill=WHITE, font=F["h3"])

    # Bottom: event chain visualization
    chain_y = 500
    draw.text((140, chain_y), "Event Chain:", fill=GRAY, font=F["body_bold"])

    events = ["focus", "input", "change", "blur"]
    arrow_x = 340
    for i, evt in enumerate(events):
        etw = draw.textlength(evt, font=F["badge"])
        bw = etw + 24
        draw_rounded_rect(draw, [arrow_x, chain_y-2, arrow_x+bw, chain_y+30], 6, fill="#1a3a38", outline=TEAL, width=1)
        draw.text((arrow_x+12, chain_y+4), evt, fill=TEAL, font=F["badge"])
        arrow_x += bw + 10
        if i < len(events) - 1:
            draw.text((arrow_x, chain_y+2), "\u2192", fill=GRAY, font=F["body"])
            arrow_x += 30

    # Property setter explanation
    ps_y = chain_y + 60
    draw_rounded_rect(draw, [120, ps_y, W-120, ps_y + 120], 10, fill=DARK_CARD)

    code_lines = [
        ("// React-compatible value setting", "#666"),
        ("Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')", TEAL),
        ("  .set.call(input, 'Sarah Johnson');", LIGHT_GRAY),
        ("input.dispatchEvent(new Event('input', { bubbles: true }));", LIGHT_GRAY),
    ]
    ly = ps_y + 12
    for line, color in code_lines:
        draw.text((145, ly), line, fill=color, font=F["small"])
        ly += 24

    draw_logo(draw, W-220, H-50)
    img.save(f"{OUT}/screenshot-framework.png")
    print("  screenshot-framework.png")


# ─── Screenshot 4: Keyboard Shortcuts ───
def make_shortcuts():
    img, draw = new_img()

    t = "Speed Up Your Workflow"
    tw = draw.textlength(t, font=F["h1"])
    draw.text(((W-tw)//2, 55), t, fill=WHITE, font=F["h1"])

    sub = "Keyboard shortcuts and context menus for lightning-fast form filling."
    sw = draw.textlength(sub, font=F["body"])
    draw.text(((W-sw)//2, 115), sub, fill=GRAY, font=F["body"])

    # Left column: Keyboard shortcuts
    shortcuts = [
        (["Alt", "F"], "Fill All Forms"),
        (["Alt", "Shift", "F"], "Fill Current Form"),
        (["Alt", "G"], "Regenerate Data"),
        (["Alt", "X"], "Clear All Fields"),
    ]

    col_x = 100
    row_y = 200
    draw.text((col_x, row_y - 10), "Keyboard Shortcuts", fill=TEAL, font=F["h3"])
    row_y += 35

    for keys, desc in shortcuts:
        # Draw key badges
        kx = col_x + 20
        for j, key in enumerate(keys):
            ktw = draw.textlength(key, font=F["key"])
            kw = max(ktw + 20, 48)
            kh = 40
            # Key cap look
            draw_rounded_rect(draw, [kx, row_y, kx+kw, row_y+kh], 6, fill="#333", outline="#555", width=1)
            # Subtle 3D effect - bottom border
            draw.line([(kx+6, row_y+kh), (kx+kw-6, row_y+kh)], fill="#222", width=2)
            draw.text((kx + (kw-ktw)//2, row_y+9), key, fill=WHITE, font=F["key"])
            kx += kw + 8
            if j < len(keys) - 1:
                draw.text((kx, row_y+9), "+", fill=GRAY, font=F["key"])
                kx += 22

        # Arrow and description
        draw.text((kx + 15, row_y + 9), "\u2192", fill=GRAY, font=F["body"])
        draw.text((kx + 45, row_y + 9), desc, fill=LIGHT_GRAY, font=F["body"])
        row_y += 65

    # Right column: Context menu mockup
    ctx_x = 700
    ctx_y = 200
    draw.text((ctx_x, ctx_y - 10), "Right-Click Menu", fill=TEAL, font=F["h3"])

    # Menu card
    menu_x = ctx_x + 20
    menu_y = ctx_y + 35
    menu_w = 300
    items = [
        ("\u26a1  Fill all forms on page", True),
        ("\U0001f4cb  Fill this form only", True),
        ("\U0001f504  Regenerate person data", True),
        ("\U0001f9f9  Clear all filled fields", True),
    ]
    menu_h = len(items) * 44 + 20
    draw_rounded_rect(draw, [menu_x, menu_y, menu_x+menu_w, menu_y+menu_h], 10, fill="#2d2d2d", outline="#444", width=1)
    # Drop shadow effect
    draw_rounded_rect(draw, [menu_x+3, menu_y+3, menu_x+menu_w+3, menu_y+menu_h+3], 10, fill="#111")
    draw_rounded_rect(draw, [menu_x, menu_y, menu_x+menu_w, menu_y+menu_h], 10, fill="#2d2d2d", outline="#444", width=1)

    iy = menu_y + 12
    for text, enabled in items:
        color = WHITE if enabled else "#555"
        draw.text((menu_x + 18, iy), text, fill=color, font=F["body"])
        iy += 44

    # Bottom note
    note_y = 580
    draw_rounded_rect(draw, [100, note_y, W-100, note_y+80], 10, fill=DARK_CARD)
    draw.text((140, note_y+14), "Pro Tip:", fill=TEAL, font=F["body_bold"])
    draw.text((140, note_y+42), "Customize all shortcuts in chrome://extensions/shortcuts", fill=GRAY, font=F["body"])

    draw_logo(draw, W-220, H-50)
    img.save(f"{OUT}/screenshot-shortcuts.png")
    print("  screenshot-shortcuts.png")


# ─── Screenshot 5: Privacy ───
def make_privacy():
    img, draw = new_img()

    t = "Your Privacy. Protected."
    tw = draw.textlength(t, font=F["h1"])
    draw.text(((W-tw)//2, 60), t, fill=WHITE, font=F["h1"])

    sub = "$1.99 one-time purchase. No subscription ever."
    sw = draw.textlength(sub, font=F["body"])
    draw.text(((W-sw)//2, 120), sub, fill=TEAL, font=F["body"])

    # Shield icon (centered)
    cx, cy = W//2, 350
    # Draw shield shape using polygon
    shield_pts = [
        (cx, cy - 120),
        (cx + 100, cy - 80),
        (cx + 100, cy + 20),
        (cx + 60, cy + 80),
        (cx, cy + 110),
        (cx - 60, cy + 80),
        (cx - 100, cy + 20),
        (cx - 100, cy - 80),
    ]
    draw.polygon(shield_pts, fill="#1a3a38", outline=TEAL)
    # Inner shield line
    inner = [
        (cx, cy - 95),
        (cx + 75, cy - 62),
        (cx + 75, cy + 15),
        (cx + 45, cy + 60),
        (cx, cy + 82),
        (cx - 45, cy + 60),
        (cx - 75, cy + 15),
        (cx - 75, cy - 62),
    ]
    draw.polygon(inner, outline="#2a5a55")

    # Lock icon inside shield
    lock_cx, lock_cy = cx, cy - 10
    # Lock body
    lw, lh = 40, 32
    draw_rounded_rect(draw, [lock_cx-lw//2, lock_cy, lock_cx+lw//2, lock_cy+lh], 4, fill=TEAL)
    # Lock shackle (arc)
    sh_w = 24
    draw.arc([lock_cx-sh_w//2, lock_cy-24, lock_cx+sh_w//2, lock_cy+4], 180, 360, fill=TEAL, width=4)
    # Keyhole
    draw.ellipse([lock_cx-4, lock_cy+10, lock_cx+4, lock_cy+18], fill=DARKER)
    draw.rectangle([lock_cx-2, lock_cy+16, lock_cx+2, lock_cy+24], fill=DARKER)

    # Bullet points on both sides
    left_bullets = [
        "All data generated locally",
        "Zero network requests",
    ]
    right_bullets = [
        "Zero data collection",
        "No account required",
    ]

    # Left
    lx = 100
    ly = 280
    for b in left_bullets:
        # Green dot
        draw.ellipse([lx, ly+6, lx+10, ly+16], fill=TEAL)
        draw.text((lx+20, ly), b, fill=LIGHT_GRAY, font=F["h3"])
        ly += 50

    # Right
    rx = 760
    ry = 280
    for b in right_bullets:
        draw.ellipse([rx, ry+6, rx+10, ry+16], fill=TEAL)
        draw.text((rx+20, ry), b, fill=LIGHT_GRAY, font=F["h3"])
        ry += 50

    # Bottom: comparison bar
    bar_y = 530
    draw_rounded_rect(draw, [140, bar_y, W-140, bar_y + 130], 12, fill=DARK_CARD)

    # "Others" vs "FillFaker"
    draw.text((200, bar_y+15), "Others", fill="#666", font=F["h3"])
    draw.text((200, bar_y+50), "\u2717 Require accounts", fill="#666", font=F["body"])
    draw.text((200, bar_y+78), "\u2717 Phone home analytics", fill="#666", font=F["body"])

    divider_x = W//2
    draw.line([(divider_x, bar_y+15), (divider_x, bar_y+115)], fill=BORDER_GRAY, width=1)

    draw.text((divider_x+60, bar_y+15), "FillFaker", fill=TEAL, font=F["h3"])
    draw.text((divider_x+60, bar_y+50), "\u2713 100% offline", fill=TEAL, font=F["body"])
    draw.text((divider_x+60, bar_y+78), "\u2713 Open & transparent", fill=TEAL, font=F["body"])

    draw_logo(draw, W-220, H-50)
    img.save(f"{OUT}/screenshot-privacy.png")
    print("  screenshot-privacy.png")


if __name__ == "__main__":
    print("Generating FillFaker screenshots...")
    make_hero()
    make_smart_detect()
    make_framework()
    make_shortcuts()
    make_privacy()
    print("Done!")
