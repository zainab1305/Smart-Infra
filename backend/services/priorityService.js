const CATEGORY_WEIGHTS = {
  "Road Damage": 1.0,
  "Water Leakage": 0.9,
  "Street Light": 0.8,
  "Garbage": 0.7,
  "Others": 0.5,
};

const calculatePriority = ({ category, confidenceScore }) => {
  const categoryWeight = CATEGORY_WEIGHTS[category] || 0.5;

  const score =
    confidenceScore * 30 +
    categoryWeight * 30;

  return Math.round(score);
};

const generateExplanation = ({ category, confidenceScore }) => {
  let explanation = [];

  if (confidenceScore > 0.7) {
    explanation.push("High-quality visual evidence");
  } else {
    explanation.push("Limited image clarity");
  }

  explanation.push(`Category classified as ${category}`);

  return explanation.join("; ");
};

module.exports = { calculatePriority, generateExplanation };