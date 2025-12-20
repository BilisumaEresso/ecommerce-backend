 const validateAiSearch = (data, allowedCategories) => {
  if (!data || typeof data !== "object") return null;

  if (!Array.isArray(data.keywords)) return null;

  if (data.category && !allowedCategories.includes(data.category)) {
    data.category = null;
  }

  if (data.price) {
    if (typeof data.price.min !== "number") data.price.min = null;
    if (typeof data.price.max !== "number") data.price.max = null;
  }

  const allowedSorts = [
    "relevance",
    "price_asc",
    "price_desc",
    "popular",
    "newest",
  ];

  if (!allowedSorts.includes(data.sort)) {
    data.sort = "relevance";
  }

  return data;
};

module.exports={validateAiSearch}