
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dazzbfypz',
  api_key: '537887765536887',
  api_secret: 'YOUR_API_SECRET' // Replace this with your real API secret or use environment variables
});

export default cloudinary;
