import os
from PIL import Image, ImageFilter

input_path = r"c:\all projects\Highlight Model School\school managment\frontend\public\logo.jpg"
output_path = r"c:\all projects\Highlight Model School\school managment\frontend\public\logo-transparent.png"
output_path_main = r"c:\all projects\Highlight Model School\school managment\frontend\public\logo.png"

img = Image.open(input_path).convert("RGBA")
width, height = img.size

# Convert image to numpy or pixel array
pixels = img.load()

# Create a mask starting from background edges
# Find pixels connected to edges that are near white (R>230, G>230, B>230)
# A flood fill or threshold approach
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # Check if pixel is close to white
        if r > 235 and g > 235 and b > 235:
            # Set alpha to 0 (fully transparent)
            pixels[x, y] = (r, g, b, 0)
        elif r > 215 and g > 215 and b > 215:
            # Smooth feathered edge
            diff = max(r, g, b) - 215
            alpha = max(0, int(255 - (diff / 20.0) * 255))
            pixels[x, y] = (r, g, b, alpha)

# Save transparent PNG
img.save(output_path, "PNG")
img.save(output_path_main, "PNG")
print(f"Successfully saved transparent logo to {output_path} and {output_path_main}")
