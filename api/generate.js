
// /api/generate.js

// Prompt builder logic (from backend/utils/promptBuilder.js)
function buildPrompt(style, roomType, features) {
  let prompt = `a ${style} ${roomType}`;
  if (features && features.trim() !== "") {
    prompt += ` featuring ${features}`;
  }
  return prompt;
}

// Vercel serverless API handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { imageBase64, style, roomType, features } = req.body;

  if (!imageBase64 || !style || !roomType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = buildPrompt(style, roomType, features);

  // TODO: replace this mock with OpenAI API call or image editor logic
  // Example return structure:
  const generatedImageUrl = "https://example.com/generated-image.png";

  res.status(200).json({ image: generatedImageUrl });
}
