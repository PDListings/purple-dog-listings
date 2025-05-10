
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Configuration, OpenAIApi } = require("openai");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../../lib/cloudinary");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ message: "Form parsing error" });
    }

    const imageFile = files.image;
    if (!imageFile || !imageFile.filepath) {
      return res.status(400).json({ message: "Image file is missing" });
    }

    try {
      const resizedBuffer = await sharp(imageFile.filepath)
        .resize(1024, 1024, { fit: "contain", background: "#ffffff" })
        .png()
        .toBuffer();

      const maskBuffer = Buffer.from(
        new Uint8Array(1024 * 1024 * 4).fill(255)
      );

      const uploadResult = await cloudinary.uploader.upload_stream(
        { resource_type: "image", public_id: `pdl_${uuidv4()}` },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ message: "Cloudinary upload failed" });
          }

          try {
            const response = await openai.createImageEdit(
              resizedBuffer,
              maskBuffer,
              `${fields.style} ${fields.roomType} with ${JSON.parse(fields.features).join(", ")}`,
              1,
              "1024x1024"
            );

            return res.status(200).json({ url: response.data.data[0].url });
          } catch (aiError) {
            console.error("OpenAI error:", aiError);
            return res.status(500).json({ message: "Image generation failed" });
          }
        }
      );

      const stream = uploadResult;
      stream.end(resizedBuffer);
    } catch (e) {
      console.error("Processing error:", e);
      res.status(500).json({ message: "Server error during image processing" });
    }
  });
};
