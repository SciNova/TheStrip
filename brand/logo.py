from PIL import Image, ImageDraw, ImageFont

WIDTH = 400
HEIGHT = 400
BG_COLOR = (30, 50, 80)
TEXT_COLOR = (255, 255, 255)
FONT_PATH = "nasalization.otf"

img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

font_big = ImageFont.truetype(FONT_PATH, 120)
font_small = ImageFont.truetype(FONT_PATH, 40)

the_bbox = draw.textbbox((0, 0), "THE", font=font_small)
the_width = the_bbox[2] - the_bbox[0]
the_x = (WIDTH - the_width) / 2
the_y = HEIGHT / 2 - 20 - 60
draw.text((the_x, the_y), "THE", fill=TEXT_COLOR, font=font_small)

strip_bbox = draw.textbbox((0, 0), "STRIP", font=font_big)
strip_width = strip_bbox[2] - strip_bbox[0]
strip_x = (WIDTH - strip_width) / 2
strip_y = HEIGHT / 2 + 10 - 60
draw.text((strip_x, strip_y), "STRIP", fill=TEXT_COLOR, font=font_big)

img.save("logo.png")
