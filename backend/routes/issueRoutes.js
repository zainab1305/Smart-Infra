const express = require("express");
const Issue = require("../models/Issue");
const upload = require("../middleware/upload");
const analyzeImage = require("../services/imageService");
const {calculatePriority,generateExplanation}=require("../services/priorityService");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const router = express.Router();

const normalizeLocation = (value = "") => value.replace(/\s+/g, " ").trim();

const tokenizeLocation = (value = "") =>
  normalizeLocation(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const isSimilarArea = (locationA = "", locationB = "") => {
  const normalizedA = normalizeLocation(locationA).toLowerCase();
  const normalizedB = normalizeLocation(locationB).toLowerCase();

  if (!normalizedA || !normalizedB) return false;
  if (normalizedA === normalizedB) return true;

  // Handle cases like "bakrol" and "bakrol gate".
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return true;
  }

  const tokensA = tokenizeLocation(normalizedA);
  const tokensB = tokenizeLocation(normalizedB);
  if (!tokensA.length || !tokensB.length) return false;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  return jaccard >= 0.6;
};

// Create a new issue with image + confidence score
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    let confidenceScore = 0;
    const normalizedLocation = normalizeLocation(req.body.location || "");

    const sameCategoryIssues = await Issue.find({ category: req.body.category }).select("location");

    const similarComplaintCount = sameCategoryIssues.filter((issue) =>
      isSimilarArea(issue.location, normalizedLocation)
    ).length;

    const repeatComplaintCount = similarComplaintCount + 1;

    if (req.file) {
      const analysis = await analyzeImage(req.file.path);
      confidenceScore = analysis.confidenceScore || 0;
    }
    const priorityScore = calculatePriority({
      category: req.body.category,
      confidenceScore,
      repeatComplaintCount,
    });

    const explanation = generateExplanation({
      category: req.body.category,
      confidenceScore,
      repeatComplaintCount,
    });
    const issue = new Issue({
      category: req.body.category,
      location: normalizedLocation,
      imageUrl: req.file ? req.file.path : null,
      confidenceScore,
      priorityScore,
      repeatComplaintCount,
      explanation,
      user: req.user.id
    });

    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Get all issues
router.get("/", authMiddleware, async (req, res) => {
  try {
    let issues;
    if (req.user.role === 'user') {
      issues = await Issue.find({ user: req.user.id }).sort({ createdAt: -1 });
    } else {
      issues = await Issue.find().sort({ createdAt: -1 });
    }
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Generate priority list for reported issues
router.get("/priority-list", authMiddleware, adminOnly, async (req, res) => {
  try {
    const reportedIssues = await Issue.find({ status: "Reported" })
      .sort({ createdAt: 1 })
      .select("category location priorityScore repeatComplaintCount status confidenceScore createdAt");

    const groupedIssues = [];

    reportedIssues.forEach((issue) => {
      const existingGroup = groupedIssues.find(
        (group) =>
          group.category === issue.category &&
          isSimilarArea(group.representativeLocation, issue.location)
      );

      if (existingGroup) {
        existingGroup.items.push(issue);
        existingGroup.maxConfidence = Math.max(existingGroup.maxConfidence, issue.confidenceScore || 0);
        return;
      }

      groupedIssues.push({
        category: issue.category,
        representativeLocation: issue.location,
        maxConfidence: issue.confidenceScore || 0,
        items: [issue],
      });
    });

    const issues = groupedIssues
      .map((group) => {
        const repeatComplaintCount = group.items.length;
        const priorityScore = calculatePriority({
          category: group.category,
          confidenceScore: group.maxConfidence,
          repeatComplaintCount,
        });

        const firstIssue = group.items[0];

        return {
          _id: firstIssue._id,
          category: group.category,
          location: group.representativeLocation,
          priorityScore,
          repeatComplaintCount,
          confidenceScore: group.maxConfidence,
          status: "Reported",
          createdAt: firstIssue.createdAt,
        };
      })
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        if (b.repeatComplaintCount !== a.repeatComplaintCount) return b.repeatComplaintCount - a.repeatComplaintCount;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

    res.json({
      total: issues.length,
      generatedAt: new Date(),
      issues,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
