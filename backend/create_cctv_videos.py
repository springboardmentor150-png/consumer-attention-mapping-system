import os
import math
import numpy as np
import cv2

def make_cctv_video(image_path, output_mp4_path, duration_sec=10, fps=30):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error loading image: {image_path}")
        return

    h, w, _ = img.shape
    # Target 1280x720 video
    target_w, target_h = 1280, 720
    img_resized = cv2.resize(img, (target_w + 100, target_h + 100))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_mp4_path, fourcc, fps, (target_w, target_h))

    total_frames = duration_sec * fps
    for f in range(total_frames):
        t = f / total_frames
        # Subtle CCTV pan & zoom movement
        offset_x = int(50 + 40 * math.sin(t * 2 * math.pi))
        offset_y = int(50 + 30 * math.cos(t * 2 * math.pi))

        frame = img_resized[offset_y:offset_y + target_h, offset_x:offset_x + target_w].copy()

        # CCTV Noise and Scanline Effects
        # Scanlines
        scanline_alpha = 0.05
        frame[::4, :, :] = (frame[::4, :, :] * (1 - scanline_alpha)).astype(np.uint8)

        # Subtle noise
        noise = np.random.randint(-5, 6, frame.shape, dtype='int16')
        frame = np.clip(frame.astype('int16') + noise, 0, 255).astype('uint8')

        out.write(frame)

    out.release()
    print(f"Successfully generated video: {output_mp4_path}")

if __name__ == "__main__":
    cosmetics_img = r"C:\Users\sanju\.gemini\antigravity-ide\brain\0291c606-85a7-44bc-8ea2-e48424b3f11d\cctv_store_feed_cosmetics_1787147009609.jpg"
    electronics_img = r"C:\Users\sanju\.gemini\antigravity-ide\brain\0291c606-85a7-44bc-8ea2-e48424b3f11d\cctv_store_feed_electronics_1787147237936.jpg"
    fashion_img = r"C:\Users\sanju\.gemini\antigravity-ide\brain\0291c606-85a7-44bc-8ea2-e48424b3f11d\cctv_store_feed_fashion_1787147794165.jpg"

    out_dir = r"c:\Users\sanju\OneDrive\Desktop\consumer attention mapping system\Consumer-Attention-Mapping-System\frontend\public"
    
    make_cctv_video(cosmetics_img, os.path.join(out_dir, "cctv_cosmetics.mp4"))
    make_cctv_video(electronics_img, os.path.join(out_dir, "cctv_electronics.mp4"))
    make_cctv_video(fashion_img, os.path.join(out_dir, "cctv_fashion.mp4"))
