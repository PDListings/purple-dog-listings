
import formidable from "formidable";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import OpenAI from "openai";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ message: "Failed to parse form" });
    }

    try {
      const { category, style, roomType, features } = fields;
      const imageFile = files.image;

      const prompt = \`Make this a beautifully designed \${style} \${category} \${roomType} with \${JSON.parse(features).join(", ")}\`;

      const imageBuffer = fs.readFileSync(imageFile[0].filepath);

      const response = await openai.images.edit({
        image: imageBuffer,
        mask: imageBuffer,
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });

      const b64 = response.data[0].b64_json;
      const buffer = Buffer.from(b64, "base64");

      const cloudinaryUpload = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "purple-dog-listings" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        Readable.from(buffer).pipe(uploadStream);
      });

      return res.status(200).json({ url: cloudinaryUpload.secure_url });
    } catch (error) {
      console.error("Image generation error:", error);
      return res.status(500).json({ message: "Image generation failed" });
    }
  });
}
