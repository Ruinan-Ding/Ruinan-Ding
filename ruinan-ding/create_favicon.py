#!/usr/bin/env python3
from PIL import Image, ImageDraw

# Create frames
frames = []
size = 64
bg_color = (240, 248, 255)  # Light blue
border_color = (0, 102, 204)  # Blue
text_color = (0, 102, 204)  # Blue

# Positions
r_x = 15
d_x = 38
top_y = 16
bottom_y = 48

# Frame 1: Empty
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
frames.append(img)

# Frame 2: R top vertical line
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
draw.line([(r_x + 8, top_y), (r_x + 8, bottom_y)], fill=text_color, width=3)
frames.append(img)

# Frame 3: R with top curve
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
draw.line([(r_x + 8, top_y), (r_x + 8, bottom_y)], fill=text_color, width=3)
draw.arc([(r_x + 8, top_y), (r_x + 18, top_y + 14)], 0, 180, fill=text_color, width=3)
frames.append(img)

# Frame 4: R with diagonal
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
draw.line([(r_x + 8, top_y), (r_x + 8, bottom_y)], fill=text_color, width=3)
draw.arc([(r_x + 8, top_y), (r_x + 18, top_y + 14)], 0, 180, fill=text_color, width=3)
draw.line([(r_x + 13, top_y + 14), (r_x + 20, bottom_y)], fill=text_color, width=3)
frames.append(img)

# Frame 5: D vertical line
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
draw.line([(r_x + 8, top_y), (r_x + 8, bottom_y)], fill=text_color, width=3)
draw.arc([(r_x + 8, top_y), (r_x + 18, top_y + 14)], 0, 180, fill=text_color, width=3)
draw.line([(r_x + 13, top_y + 14), (r_x + 20, bottom_y)], fill=text_color, width=3)
draw.line([(d_x + 8, top_y), (d_x + 8, bottom_y)], fill=text_color, width=3)
frames.append(img)

# Frame 6: D with curve (partial)
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
draw.line([(r_x + 8, top_y), (r_x + 8, bottom_y)], fill=text_color, width=3)
draw.arc([(r_x + 8, top_y), (r_x + 18, top_y + 14)], 0, 180, fill=text_color, width=3)
draw.line([(r_x + 13, top_y + 14), (r_x + 20, bottom_y)], fill=text_color, width=3)
draw.line([(d_x + 8, top_y), (d_x + 8, bottom_y)], fill=text_color, width=3)
draw.arc([(d_x + 8, top_y), (d_x + 18, bottom_y)], 0, 90, fill=text_color, width=3)
frames.append(img)

# Frame 7: D complete
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
draw.line([(r_x + 8, top_y), (r_x + 8, bottom_y)], fill=text_color, width=3)
draw.arc([(r_x + 8, top_y), (r_x + 18, top_y + 14)], 0, 180, fill=text_color, width=3)
draw.line([(r_x + 13, top_y + 14), (r_x + 20, bottom_y)], fill=text_color, width=3)
draw.line([(d_x + 8, top_y), (d_x + 8, bottom_y)], fill=text_color, width=3)
draw.arc([(d_x + 8, top_y), (d_x + 18, bottom_y)], 0, 180, fill=text_color, width=3)
frames.append(img)

# Frame 8: Pause on complete (duplicate last frame)
frames.append(frames[-1].copy())

# Save as animated GIF
frames[0].save(
    'public/favicon.gif',
    save_all=True,
    append_images=frames[1:],
    duration=400,
    loop=0
)

print(f"Created animated favicon with {len(frames)} frames!")

# Also save a static ICO favicon (for browsers that ignore dynamic updates)
try:
    ico_img = frames[-1].convert('RGBA')
    # Pillow will include multiple sizes in the ICO when provided via sizes
    ico_img.save('public/favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])
    print('Saved static public/favicon.ico')
except Exception as e:
    print('Failed to save ICO:', e)

