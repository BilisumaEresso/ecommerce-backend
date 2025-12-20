const Product = require("../model/Product");
const { aiRecommendationIntent } = require("../services/ai/aiRecommendation.services");

const getRecommendedProducts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Get AI intent (already optimized & single call)
    const intent = await aiRecommendationIntent(userId);

    const {
      primaryCategories = [],
      secondaryCategories = [],
      keywords = [],
      pricePreference = {},
    } = intent;

    // 2. Build MongoDB query dynamically
    const query = {
      quantity: { $gt: 0 }, // only available products
    };

    if (primaryCategories.length || secondaryCategories.length) {
      query.category = {
        $in: [...primaryCategories, ...secondaryCategories],
      };
    }

    if (keywords.length) {
      query.$or = [
        { name: { $regex: keywords.join("|"), $options: "i" } },
        { desc: { $regex: keywords.join("|"), $options: "i" } },
      ];
    }

    if (pricePreference.min != null || pricePreference.max != null) {
      query.price = {};
      if (pricePreference.min != null) query.price.$gte = pricePreference.min;
      if (pricePreference.max != null) query.price.$lte = pricePreference.max;
    }

    // 3. Execute query
    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort({
        createdAt: -1, // freshness bias
      })
      .limit(10);

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

module.exports = { getRecommendedProducts };

