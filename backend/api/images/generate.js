import { IncomingForm } from "formidable";
import sharp from "sharp";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import fs from "fs/promises";
import nextRateLimit from "next-rate-limit";
import logger from "@/backend/utils/logger";
import Joi from "joi";

// Disable default body parsing by Next.js
export const config = {
  api: { bodyParser: false },
};

// Constants
const TMP_DIR = process.env.TMP_DIR || "./tmp";
const CLOUDINARY_FOLDER = "pdl/generated";
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ERRORS = {
  MISSING_FIELDS: "Missing required fields. Ensure 'style', 'category', and 'roomType' are provided.",
  INVALID_FILE_TYPE: "Unsupported image type. Only PNG and JPEG are accepted.",
  FILE_TOO_LARGE: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
};

// Environment validation
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.OPENAI_API_KEY) {
  throw new Error("Missing required environment variables");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure rate limiter
const rateLimiter = nextRateLimit({
  limit: 100,
  interval: 15 * 60 * 1000,
});

// Schema validation for input fields
const fieldsSchema = Joi.object({
  style: Joi.string().required(),
  category: Joi.string().required(),
  roomType: Joi.string().required(),
  features: Joi.string().optional(),
});

// Ensure tmp directory exists and is writable
const ensureTmpDir = async () => {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
    await fs.access(TMP_DIR, fs.constants.W_OK);
  } catch (err) {
    logger.error("❌ Cannot write to TMP directory. Check permissions.");
    throw new Error("TMP directory not writable");
  }
};

// Handle file uploads
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.uploadDir = TMP_DIR;
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

// Main handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await rateLimiter(req, res);
    if (res.headersSent) {
      logger.warn("Rate limit triggered. Request was blocked.");
      return;
    }
  } catch (rateErr) {
    logger.error("Rate limiter error:", rateErr);
    return res.status(500).json({ error: "Rate limiting failed." });
  }

  try {
    await ensureTmpDir();
    const { fields, files } = await parseForm(req);
    logger.info("User input fields:", fields);

    // Validate input
    const { error, value: validatedFields } = fieldsSchema.validate(fields);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const imageFile = files.image;
    const filePath = imageFile?.filepath || imageFile?.path;

    if (!imageFile || !filePath || typeof imageFile !== "object") {
      return res.status(400).json({ error: "No valid image file uploaded." });
    }

    if (!ALLOWED_TYPES.includes(imageFile.mimetype)) {
      return res.status(400).json({ error: ERRORS.INVALID_FILE_TYPE });
    }

    if (imageFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: ERRORS.FILE_TOO_LARGE });
    }

    // Parse features
    let featuresList = [];
    try {
      featuresList = JSON.parse(validatedFields.features || "[]");
    } catch {
      logger.warn("Invalid features format. Defaulting to empty list.");
    }

    // Resize & convert image
    const inputBuffer = await sharp(filePath)
      .resize(1024, 1024, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await fs.unlink(filePath); // Cleanup

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDER,
          resource_type: "image",
          format: "png",
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      Readable.from(inputBuffer).pipe(stream);
    });

    // Generate prompt
    const featuresText = featuresList.length > 0 ? featuresList.join(", ") : "no specific features";
    const prompt = `Create a ${validatedFields.style} ${validatedFields.category} design for a ${validatedFields.roomType} that includes ${featuresText}`;
    logger.info(`🧠 Prompt to OpenAI: ${prompt}`);

    // Call OpenAI
    const aiResponse = await openai.images.generate({
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    const imageUrl = aiResponse?.data?.[0]?.url;
    if (!imageUrl) {
      logger.error("OpenAI API did not return a valid URL", { response: aiResponse?.data });
      return res.status(500).json({ error: "Failed to generate AI image. No valid response from OpenAI." });
    }

    logger.info("✅ File uploaded to Cloudinary", { url: uploadResult.secure_url });
    logger.info("✅ Generated AI Image URL", { url: imageUrl });

    return res.status(200).json({
      status: "success",
      uploadedUrl: uploadResult.secure_url,
      aiGeneratedUrl: imageUrl,
      prompt,
      originalName: imageFile.originalFilename || "uploaded-image",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`❌ Error processing image: ${err.message}`, { stack: err.stack });
    return res.status(500).json({ error: "Image generation failed" });
  }
}