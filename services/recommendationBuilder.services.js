const {Category} = require("../model");

/**
 * Converts AI intent into a single MongoDB Product query
 */
const buildProductRecommendationQuery = async (intent) => {
  const {
    primaryCategories = [],
    secondaryCategories = [],
    keywords = [],
    pricePreference = {},
  } = intent;

  const query = {
    quantity: { $gt: 0 },
  };

  const orConditions = [];

  /**
   * 1. CATEGORY MATCHING (via IDs)
   */
  if (primaryCategories.length || secondaryCategories.length) {
    const categoryNames = [
      ...new Set([...primaryCategories, ...secondaryCategories]),
    ];

    const categories = await Category.find({
      $or: [
        { name: { $in: categoryNames.map((c) => new RegExp(c, "i")) } },
        { desc: { $in: categoryNames.map((c) => new RegExp(c, "i")) } },
      ],
    }).select("_id");

    if (categories.length) {
      orConditions.push({
        category: { $in: categories.map((c) => c._id) },
      });
    }
  }

  /**
   * 2. KEYWORD MATCHING (product-level)
   */
  if (keywords.length) {
    const keywordRegex = keywords.join("|");

    orConditions.push({
      $or: [
        { name: { $regex: keywordRegex, $options: "i" } },
        { desc: { $regex: keywordRegex, $options: "i" } },
      ],
    });
  }

  /**
   * 3. PRICE FILTER (optional)
   */
  if (pricePreference?.min != null || pricePreference?.max != null) {
    query.price = {};
    if (pricePreference.min != null) query.price.$gte = pricePreference.min;
    if (pricePreference.max != null) query.price.$lte = pricePreference.max;
  }

  /**
   * 4. FINAL OR MERGE
   */
  if (orConditions.length) {
    query.$or = orConditions;
  }

  return query;
};

module.exports = { buildProductRecommendationQuery };
