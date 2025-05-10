require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { generatePrompt } = require("./utils/promptBuilder");
const { Configuration, OpenAIApi } = require("openai");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

app.post("/edit-home-image", upload.single("image"), async (req, res) => {
  const { category, style, roomType, features } = req.body;
  const prompt = generatePrompt({ category, style, roomType, features: JSON.parse(features) });

  const response = await openai.createImageEdit({
    image: req.file.buffer,
    prompt,
    n: 1,
    size: "1024x1024",
    response_format: "url"
  });

  const finalCost = 0.02 * 1.01;
  res.json({ url: response.data.data[0].url, cost: finalCost });
});

app.listen(5000, () => console.log("Server running on port 5000"));
