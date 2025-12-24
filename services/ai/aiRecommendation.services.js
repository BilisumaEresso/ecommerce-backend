const OpenAI = require("openai").default;
const {Cart,Order} = require("../../model");

const client = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN,
  baseURL: process.env.AI_BASE_URL,
});


const buildCartSummary = (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
   
    return {
      categories: [],
      products: [],
      avgPrice: null,
    };
  }

  const categories = new Set();
  const products = [];
  let total = 0;
  let count = 0;

  for (const item of cart.items) {
    if (item.product?.category?.name) {
      categories.add(item.product.category.name);
    }
    if (item.product?.name) {
      products.push(item.product.name);
    }

    const price = Number(item.price || item.product?.price || 0);
    total += price;
    count++;
  }

  return {
    categories: [...categories],
    products,
    avgPrice: count ? Math.round(total / count) : null,
  };
};


const buildOrderSummary = (orders) => {
  if (!orders || orders.length === 0) {
    return {
      topCategories: [],
      avgSpend: null,
      lastOrderDays: null,
    };
  }

  const categoryCount = {};
  let totalSpend = 0;

  for (const order of orders) {
    totalSpend += Number(order.totalAmount || 0);

    for (const item of order.items || []) {
      const cat = item.product?.category?.name;
      if (cat) {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      }
    }
  }

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const lastOrder = orders[0];
  const lastOrderDays = Math.floor(
    (Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24)
  );

  return {
    topCategories,
    avgSpend: Math.round(totalSpend / orders.length),
    lastOrderDays,
  };
};

const aiRecommendationIntent = async (userId) => {
  try {
   
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.product.category");

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.product")
      .populate("items.product.category");
 
    const cartSummary = buildCartSummary(cart);
    const orderSummary = buildOrderSummary(orders);

    const response = await client.chat.completions.create({
      model: process.env.AI_MODEL,
      temperature: 0,
      max_tokens: 250,
      messages: [
        {
          role: "system",
          content:
            "You are an e-commerce recommendation engine. Respond ONLY with valid JSON.",
        },
        {
          role: "user",
          content: `
User cart summary:
- Categories: ${cartSummary.categories.join(", ") || "none"}
- Products: ${cartSummary.products.join(", ") || "none"}
- Avg price: ${cartSummary.avgPrice ?? "unknown"}

User order history summary:
- Top categories: ${orderSummary.topCategories.join(", ") || "none"}
- Avg spend: ${orderSummary.avgSpend ?? "unknown"}
- Last order days ago: ${orderSummary.lastOrderDays ?? "unknown"}

Return JSON using this schema:
{
  "intent": "recommendation",
  "primaryCategories": [],
  "secondaryCategories": [],
  "keywords": [],
  "pricePreference": { "min": null, "max": null },
  "recommendationStrategy": "cart_based | history_based | mixed",
  "confidence": 0.0
}

Rules:
- Categories must relate to cart or history
- Keywords should be product-level
- Choose ONE strategy
- JSON only
        `,
        },
      ],
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = { aiRecommendationIntent };
