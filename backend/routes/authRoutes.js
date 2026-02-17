const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

// Admin Login (with hardcoded admin credentials)
router.post("/login/admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@smartinfra.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: "admin", email, role: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Admin login successful",
        token,
        user: { email, role: "admin" },
      });
    }

    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Register
router.post("/register/user", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      role: "user",
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: "user" },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Login
router.post("/login/user", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "user" });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "User account is inactive" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Worker Login
router.post("/login/worker", async (req, res) => {
  try {
    const { workerId, password } = req.body;

    const worker = await User.findOne({ workerId, role: "worker" });
    if (!worker || worker.password !== password) {
      return res.status(401).json({ message: "Invalid Worker ID or password" });
    }

    if (!worker.isActive) {
      return res.status(401).json({ message: "Worker account is inactive" });
    }

    const token = jwt.sign(
      { id: worker._id, email: worker.email, role: worker.role, workerId: worker.workerId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: worker._id,
        name: worker.name,
        workerId: worker.workerId,
        email: worker.email,
        role: worker.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create Worker Account
router.post("/create-worker", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, workerId } = req.body;

    const existingWorker = await User.findOne({
      $or: [{ email }, { workerId }],
    });

    if (existingWorker) {
      return res.status(400).json({ message: "Worker ID or email already exists" });
    }

    const worker = new User({
      name,
      email,
      password,
      phone,
      workerId,
      role: "worker",
    });

    await worker.save();

    res.status(201).json({
      message: "Worker account created successfully",
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        workerId: worker.workerId,
        role: "worker",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all users/workers
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Deactivate user/worker
router.put("/:userId/deactivate", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    );

    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
