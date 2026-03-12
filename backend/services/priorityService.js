const CATEGORY_WEIGHTS = {
  "Road Damage": 1.0,
  "Water Leakage": 0.9,
  "Street Light": 0.8,
  "Garbage": 0.7,
  "Others": 0.5,
};

const calculatePriority = ({ category, confidenceScore, repeatComplaintCount = 1 }) => {
  const categoryWeight = CATEGORY_WEIGHTS[category] || 0.5;
  const repeatBoost = Math.min(Math.max(repeatComplaintCount - 1, 0) * 5, 20);

  const score =
    confidenceScore * 40 +
    categoryWeight * 40 +
    repeatBoost;

  return Math.min(100, Math.round(score));
};

const generateExplanation = ({ category, confidenceScore, repeatComplaintCount = 1 }) => {
  let explanation = [];

  if (confidenceScore > 0.7) {
    explanation.push("High-quality visual evidence");
  } else {
    explanation.push("Limited image clarity");
  }

  explanation.push(`Category classified as ${category}`);

  if (repeatComplaintCount > 1) {
    explanation.push(`Repeated complaint at location (${repeatComplaintCount} reports)`);
  }

  return explanation.join("; ");
};

module.exports = { calculatePriority, generateExplanation };