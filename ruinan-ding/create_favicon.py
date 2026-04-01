#!/usr/bin/env python3
from PIL import Image, ImageDraw
import math

# Create frames
frames = []
size = 64
center = size // 2
bg_color = (240, 248, 255)  # Light blue background
border_color = (0, 102, 204)  # Blue border
text_color = (0, 102, 204)  # Blue text

# Calculate positions for letters
r_start_x = 16
d_start_x = 38

# Frame 1-3: Draw R (3 frames for smooth animation)
for r_progress in [0.33, 0.66, 1.0]:
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Background and border
    draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
    
    # Draw R parts progressively
    if r_progress > 0:
        # Vertical line of R
        draw.line([(r_start_x + 6, 18), (r_start_x + 6, 45)], fill=text_color, width=3)
        
        # Top curve of R
        if r_progress > 0.33:
            draw.arc([(r_start_x + 6, 18), (r_start_x + 16, 32)], 0, 180, fill=text_color, width=3)
        
        # Diagonal leg of R
        if r_progress > 0.66:
            draw.line([(r_start_x + 12, 32), (r_start_x + 18, 45)], fill=text_color, width=3)
    
    frames.append(img)

# Frame 4-6: Draw D (3 frames for smooth animation)
for d_progress in [0.33, 0.66, 1.0]:
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Background and border
    draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
    
    # R stays complete
    draw.line([(r_start_x + 6, 18), (r_start_x + 6, 45)], fill=text_color, width=3)
    draw.arc([(r_start_x + 6, 18), (r_start_x + 16, 32)], 0, 180, fill=text_color, width=3)
    draw.line([(r_start_x + 12, 32), (r_start_x + 18, 45)], fill=text_color, width=3)
    
    # Draw D parts progressively
    if d_progress > 0:
        # Vertical line of D
        draw.line([(d_start_x + 6, 18), (d_start_x + 6, 45)], fill=text_color, width=3)
        
        # Curve of D (right half of oval)
        if d_progress > 0:
            # Calculate arc based on progress
            end_angle = int(180 * d_progress)
            draw.arc([(d_start_x + 6, 18), (d_start_x + 16, 45)], 0, end_angle, fill=text_color, width=3)
    
    frames.append(img)

# Last frame: Keep both visible
img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([2, 2, size-2, size-2], fill=bg_color, outline=border_color, width=1)
# R
draw.line([(r_start_x + 6, 18), (r_start_x + 6, 45)], fill=text_color, width=3)
draw.arc([(r_start_x + 6, 18), (r_start_x + 16, 32)], 0, 180, fill=text_color, width=3)
draw.line([(r_start_x + 12, 32), (r_start_x + 18, 45)], fill=text_color, width=3)
# D
draw.line([(d_start_x + 6, 18), (d_start_x + 6, 45)], fill=text_color, width=3)
draw.arc([(d_start_x + 6, 18), (d_start_x + 16, 45)], 0, 180, fill=text_color, width=3)
frames.append(img)

# Save as animated GIF
frames[0].save(
    'public/favicon.gif',
    save_all=True,
    append_images=frames[1:],
    duration=500,  # 500ms per frame
    loop=0  # Loop forever
)

print("Animated favicon.gif created successfully!")
