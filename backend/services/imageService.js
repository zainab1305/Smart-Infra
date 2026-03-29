const axios = require("axios");
const path = require("path");

const analyzeImage = async (relativeImagePath) => {
  try {
    const baseUrl = process.env.PYTHON_SERVICE_URL || process.env.IMAGE_SERVICE_URL || "http://localhost:8000";
    const endpoint = `${baseUrl.replace(/\/$/, "")}/analyze-image`;

    // IMPORTANT: resolve from backend directory
    const absolutePath = path.resolve(__dirname, "..", relativeImagePath);

    console.log("Sending to FastAPI:", absolutePath);

    const response = await axios.post(endpoint, {
      image_path: absolutePath,
    }, {
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message || error.code || "Unknown error";
    console.error("Image analysis failed:", details);
    return { confidenceScore: 0 };
  }
};

module.exports = analyzeImage;
