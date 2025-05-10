
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const image = files.image?.[0];
    const category = fields.category?.[0] || '';
    const style = fields.style?.[0] || '';
    const roomType = fields.roomType?.[0] || '';
    const features = JSON.parse(fields.features?.[0] || '[]');

    if (!image || !fs.existsSync(image.filepath)) {
      return res.status(400).json({ error: 'Image file missing or unreadable' });
    }

    const prompt = `Create a ${style} ${category} design for a ${roomType} including features like ${features.join(', ')}`;

    try {
      const response = await openai.createImageEdit(
        fs.createReadStream(image.filepath),
        prompt,
        1,
        '1024x1024'
      );

      const imageUrl = response.data.data[0].url;
      res.status(200).json({ url: imageUrl });
    } catch (error) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  });
}
