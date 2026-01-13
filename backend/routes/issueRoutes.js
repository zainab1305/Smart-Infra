const express = require("express");
const Issue = require("../models/Issue");
const upload = require("../middleware/upload");
const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
    console.log("POST /api/issues HIT");
  try {
    console.log(req.body);
    console.log(req.file);
    const issue = new Issue({
      category: req.body.category,
      location: req.body.location,
      imageUrl: req.file ? req.file.path : null,
    });
    

    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Create a new issue
router.post("/", async (req, res) => {
  try {
    const issue = new Issue(req.body);
    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
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
