const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const workerOrAdmin = (req, res, next) => {
  if (!["worker", "admin"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Worker or Admin access required" });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, workerOrAdmin };
