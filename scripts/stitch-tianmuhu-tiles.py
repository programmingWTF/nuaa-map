"""将天目湖校区地图瓦片拼接为完整图片，并输出局部坐标。"""
import json
from pathlib import Path
from PIL import Image

TILE_DIR = Path("assets/map/tiles-tianmuhu")
OUTPUT_PATH = Path("frontend/public/tianmuhu-map.jpg")
BUILDINGS_IN = Path("data/extracted-map/tianmuhu-buildings.json")
BUILDINGS_OUT = Path("data/extracted-map/tianmuhu-buildings-local.json")

COLS = [44, 45, 46, 47, 48, 49]
ROWS = [13, 14, 15, 16, 17, 18]
TILE_SIZE = 256

# 左上角瓦片 (44,13) 在全局坐标系中的 DOM 位置
ORIGIN_X = 8877
ORIGIN_Y = 1757

# --- 1. 拼接瓦片 ---
grid_w = len(COLS)
grid_h = len(ROWS)
stitched = Image.new("RGB", (grid_w * TILE_SIZE, grid_h * TILE_SIZE))

for ci, col in enumerate(COLS):
    for ri, row in enumerate(ROWS):
        tile_path = TILE_DIR / f"{col}_{row}.jpg"
        if tile_path.exists():
            tile = Image.open(tile_path)
            stitched.paste(tile, (ci * TILE_SIZE, ri * TILE_SIZE))
            print(f"  OK tile {col}_{row} -> ({ci * TILE_SIZE},{ri * TILE_SIZE})")
        else:
            print(f"  MISS tile {col}_{row}")

stitched.save(OUTPUT_PATH, quality=92)
print(f"\nStitched: {OUTPUT_PATH} ({grid_w * TILE_SIZE}x{grid_h * TILE_SIZE})")

# --- 2. 转换坐标为局部坐标 ---
with open(BUILDINGS_IN, encoding="utf-8") as f:
    data = json.load(f)

local_buildings = []
for b in data["buildings"]:
    local_buildings.append({
        "name": b["name"],
        "x": b["x"] - ORIGIN_X,
        "y": b["y"] - ORIGIN_Y,
        "type": b["type"]
    })

output = {
    "source": data["source"],
    "campus": data["campus"],
    "imagePath": "tianmuhu-map.jpg",
    "imageSize": {"width": grid_w * TILE_SIZE, "height": grid_h * TILE_SIZE},
    "buildings": local_buildings
}

with open(BUILDINGS_OUT, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Converted: {BUILDINGS_OUT} ({len(local_buildings)} buildings)")
