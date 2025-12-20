const OpenAI = require("openai").default;
const {Category}=require("../../model")

const client = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN,
  baseURL: process.env.AI_BASE_URL,
});

const aiSearchIntent = async (query) => {
  const categories = await Category.find().select("name -_id");
  const categoryNames = categories.map((c) => c.name).join(", ");

  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    temperature: 0,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You extract e-commerce search intent. Respond ONLY with valid JSON.",
      },
      {
        role: "user",
        content: `
Extract search filters from this query:
"${query}"

Allowed categories:
${categoryNames}

Return JSON in this exact schema:
{
  "keywords": [],
  "category": null,
  "price": { "min": null, "max": null },
  "sort": "relevance"
}

Rules:
- category must be from allowed list
- sort must be one of: relevance, price_asc, price_desc, popular, newest
- JSON only, no explanation
        `,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { aiSearchIntent };
