from fastapi import FastAPI
from pydantic import BaseModel
import cv2
import numpy as np

app = FastAPI()

class ImageRequest(BaseModel):
    image_path: str

def brightness_score(gray):
    mean_val = np.mean(gray) / 255.0
    # Ideal brightness roughly mid-range
    return max(0.0, min(1.0, 1 - abs(mean_val - 0.5) * 2))

def blur_score(gray):
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Normalize blur variance (simple clamp)
    return max(0.0, min(1.0, lap_var / 500.0))

@app.post("/analyze-image")
def analyze_image(req: ImageRequest):
    img = cv2.imread(req.image_path)
    if img is None:
        return {"confidenceScore": 0.0, "reason": "Image not readable"}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    b_score = brightness_score(gray)
    bl_score = blur_score(gray)

    confidence = round((0.5 * b_score + 0.5 * bl_score), 2)

    return {
        "brightnessScore": round(b_score, 2),
        "blurScore": round(bl_score, 2),
        "confidenceScore": confidence
    }