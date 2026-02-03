const axios = require("axios");
const path = require("path");

const analyzeImage = async (relativeImagePath) => {
  try {
    // IMPORTANT: resolve from backend directory
    const absolutePath = path.resolve(__dirname, "..", relativeImagePath);

    console.log("Sending to FastAPI:", absolutePath);

    const response = await axios.post("http://localhost:8000/analyze-image", {
      image_path: absolutePath,
    });

    return response.data;
  } catch (error) {
    console.error("Image analysis failed:", error.message);
    return { confidenceScore: 0 };
  }
};

module.exports = analyzeImage;
