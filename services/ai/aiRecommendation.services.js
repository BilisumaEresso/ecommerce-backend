const OpenAI = require("openai").default;

const client = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN,
  baseURL: process.env.AI_BASE_URL,
});

