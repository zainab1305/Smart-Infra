const express = require("express");
const Issue = require("../models/Issue");
const upload = require("../middleware/upload");
const analyzeImage = require("../services/imageService");
const {calculatePriority,generateExplanation}=require("../services/priorityService");
const router = express.Router();

// Create a new issue with image + confidence score
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let confidenceScore = 0;

    if (req.file) {
      const analysis = await analyzeImage(req.file.path);
      confidenceScore = analysis.confidenceScore || 0;
    }
    const priorityScore = calculatePriority({
    category: req.body.category,
    confidenceScore,
    });

    const explanation = generateExplanation({
    category: req.body.category,
    confidenceScore,
    });
    const issue = new Issue({
      category: req.body.category,
      location: req.body.location,
      imageUrl: req.file ? req.file.path : null,
      confidenceScore,
      priorityScore,
      explanation
    });

    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Get all issues
router.get("/", async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
