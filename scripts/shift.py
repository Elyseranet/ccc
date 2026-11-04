import sys
from PIL import Image, ImageChops, ImageStat

name = sys.argv[1]
a = Image.open(f'visual-results/{name}-maquette.png').convert('L')
b = Image.open(f'visual-results/{name}-app.png').convert('L')
regions = {'query': (30, 50, 200, 95), 'select': (30, 130, 200, 175), 'btn': (20, 190, 340, 235)}
for label, (x0, y0, x1, y1) in regions.items():
    best = None
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            ra = a.crop((x0, y0, x1, y1))
            rb = b.crop((x0 + dx, y0 + dy, x1 + dx, y1 + dy))
            d = ImageStat.Stat(ImageChops.difference(ra, rb)).mean[0]
            if best is None or d < best[0]:
                best = (round(d, 3), dx, dy)
    zero = ImageStat.Stat(ImageChops.difference(a.crop((x0, y0, x1, y1)), b.crop((x0, y0, x1, y1)))).mean[0]
    print(label, 'best (diff, dx, dy):', best, 'at 0,0:', round(zero, 3))
