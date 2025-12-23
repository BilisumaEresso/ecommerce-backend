const {Product,Trending,Category} = require("../model");
const { aiRecommendationIntent } = require("../services/ai/aiRecommendation.services");
const {
  buildProductRecommendationQuery,
} = require("../services/recommendationBuilder.services");
const { generateTrendsFromAI } = require("../services/ai/aiTrends.services");

const recommendProducts = async (req, res, next) => {
  try {
    const intent = await aiRecommendationIntent(req.user.id);

    const productQuery = await buildProductRecommendationQuery(intent);

    const products = await Product.find(productQuery)
      .populate("category", "name").populate("photo")
      .limit(20)
      .lean();

    res.status(200).json({
      status: true,
      strategy: intent.recommendationStrategy,
      confidence: intent.confidence,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};



// 🔹 Generate & store trends (manual trigger)
const generateTrends = async (req, res, next) => {
  try {
    // 1. Load allowed categories
    const categories = await Category.find().select("name -_id");
    const categoryNames = categories.map((c) => c.name);

    // 2. Ask AI
    const aiResult = await generateTrendsFromAI(categoryNames);

    if (!aiResult.trends || !Array.isArray(aiResult.trends)) {
      throw new Error("Invalid AI trend response");
    }

    await Trending.deleteMany({});

    const savedTrends = await Trending.insertMany(
      aiResult.trends.map((t) => ({
        name: t.name,
        category: t.category,
        reason: t.reason,
        source: t.source || "AI trend analysis",
      }))
    );

    res.status(201).json({
      status: true,
      count: savedTrends.length,
      trends: savedTrends,
    });
  } catch (error) {
    next(error);
  }
};

// 🔹 Fetch trends for frontend
const getTrends = async (req, res, next) => {
  try {
    const trends = await Trending.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      count: trends.length,
      trends,
    });
  } catch (error) {
    next(error);
  }
};



module.exports = { recommendProducts, generateTrends, getTrends };

