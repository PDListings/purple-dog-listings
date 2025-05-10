import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error parsing the files' });
    }

    const { category, style, roomType, features } = fields;
    const imageFile = files.image[0];

    try {
      const prompt = `Generate a ${style} ${category} design for a ${roomType} with features like ${features}.`;
      const response = await openai.images.edit({
        image: fs.createReadStream(imageFile.filepath),
        mask: fs.createReadStream(imageFile.filepath), // For now, use same image as mask
        prompt,
        n: 1,
        size: '1024x1024',
      });

      res.status(200).json({ url: response.data.data[0].url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error generating image with OpenAI' });
    }
  });
}