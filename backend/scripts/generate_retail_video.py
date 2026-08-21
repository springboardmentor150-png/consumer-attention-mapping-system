import cv2
import numpy as np
import os
import subprocess

def create_retail_video():
    width, height = 1280, 720
    fps = 30
    duration_sec = 10
    total_frames = fps * duration_sec

    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    root_dir = os.path.abspath(os.path.join(backend_dir, ".."))

    os.makedirs(os.path.join(backend_dir, "uploads", "videos"), exist_ok=True)
    os.makedirs(os.path.join(root_dir, "frontend"), exist_ok=True)

    temp_path = os.path.join(backend_dir, "uploads", "videos", "temp_retail_raw.mp4")
    final_path1 = os.path.join(backend_dir, "uploads", "videos", "test_retail_shopper.mp4")
    final_path2 = os.path.join(root_dir, "frontend", "vedio.mp4")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))

    shoppers = [
        {'id': 'PERSON #1', 'start_x': 200, 'end_x': 520, 'y': 450, 'head_r': 24, 'body_h': 160, 'color': (57, 255, 20)},
        {'id': 'PERSON #2', 'start_x': 1050, 'end_x': 740, 'y': 480, 'head_r': 22, 'body_h': 150, 'color': (255, 0, 189)},
        {'id': 'PERSON #3', 'start_x': 580, 'end_x': 660, 'y': 510, 'head_r': 26, 'body_h': 170, 'color': (254, 242, 0)}
    ]

    for frame_idx in range(total_frames):
        t = frame_idx / total_frames
        img = np.zeros((height, width, 3), dtype=np.uint8)

        # Background Floor & Ceiling
        cv2.rectangle(img, (0, 0), (width, 480), (25, 20, 15), -1)
        cv2.rectangle(img, (0, 480), (width, height), (40, 35, 30), -1)

        # Overhead Lighting
        for lx in range(100, width, 250):
            cv2.rectangle(img, (lx, 20), (lx + 120, 40), (240, 245, 255), -1)

        # Left Beverages Shelf
        cv2.rectangle(img, (50, 120), (450, 460), (45, 35, 25), -1)
        cv2.rectangle(img, (50, 120), (450, 460), (80, 70, 60), 3)
        cv2.putText(img, 'BEVERAGES & JUICES', (80, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 242, 254), 2)
        for sy in [200, 290, 380]:
            cv2.line(img, (55, sy), (445, sy), (120, 110, 100), 4)
            for px in range(70, 430, 40):
                cv2.rectangle(img, (px, sy - 40), (px + 25, sy), (200, 50, 40) if px % 80 == 0 else (40, 180, 80), -1)

        # Right Snacks Shelf
        cv2.rectangle(img, (830, 120), (1230, 460), (45, 35, 25), -1)
        cv2.rectangle(img, (830, 120), (1230, 460), (80, 70, 60), 3)
        cv2.putText(img, 'SNACKS & CHIPS', (860, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (79, 172, 254), 2)
        for sy in [200, 290, 380]:
            cv2.line(img, (835, sy), (1225, sy), (120, 110, 100), 4)
            for px in range(850, 1210, 40):
                cv2.rectangle(img, (px, sy - 40), (px + 25, sy), (240, 180, 30) if px % 80 == 0 else (180, 40, 200), -1)

        # Render Human Shoppers Walking in Video Frame
        for s in shoppers:
            cx = int(s['start_x'] + (s['end_x'] - s['start_x']) * np.sin(t * np.pi))
            cy = s['y']
            hr = s['head_r']
            bh = s['body_h']
            c = s['color']

            # Shadow
            cv2.ellipse(img, (cx, cy + 10), (hr + 15, 10), 0, 0, 360, (15, 15, 15), -1)

            # Legs
            leg_offset = int(12 * np.sin(t * np.pi * 10))
            cv2.line(img, (cx - 8, cy - bh // 3), (cx - 14 + leg_offset, cy), (60, 60, 70), 8)
            cv2.line(img, (cx + 8, cy - bh // 3), (cx + 14 - leg_offset, cy), (60, 60, 70), 8)

            # Torso
            cv2.rectangle(img, (cx - hr, cy - bh + hr * 2), (cx + hr, cy - bh // 3), c, -1)
            cv2.rectangle(img, (cx - hr, cy - bh + hr * 2), (cx + hr, cy - bh // 3), (255, 255, 255), 2)

            # Head
            cv2.circle(img, (cx, cy - bh + hr), hr, (220, 190, 170), -1)
            cv2.circle(img, (cx, cy - bh + hr), hr, (255, 255, 255), 2)

            # Tag
            cv2.putText(img, s['id'], (cx - hr - 10, cy - bh - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, c, 2)

        out.write(img)

    out.release()
    print("Raw Temp Video Generated:", temp_path)

    # Fast copy / re-encode for web streaming
    import shutil
    shutil.copyfile(temp_path, final_path1)
    shutil.copyfile(temp_path, final_path2)
    print("Video 1 Ready:", final_path1, os.path.getsize(final_path1))
    print("Video 2 Ready:", final_path2, os.path.getsize(final_path2))

if __name__ == "__main__":
    create_retail_video()
