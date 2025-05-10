
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { OpenAI } from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ error: "Error parsing form data" });
    }

    try {
      const { category, style, roomType, features } = fields;
      const prompt = `A ${style} ${category} design for a ${roomType} with features like ${JSON.parse(features).join(", ")}`;

      const imageFile = files.image[0];
      const inputPath = imageFile.filepath;
      const outputPath = path.join(process.cwd(), "public", "processed.png");

      // Convert to PNG and resize to 1024x1024 square
      await sharp(inputPath)
        .resize(1024, 1024, { fit: "cover" })
        .png()
        .toFile(outputPath);

      const response = await openai.images.edit({
        image: fs.createReadStream(outputPath),
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      });

      res.status(200).json({ url: response.data[0].url });
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image." });
    }
  });
}
