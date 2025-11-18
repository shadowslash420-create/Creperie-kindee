import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const form = formidable({});
    const [fields] = await form.parse(req);

    const image = fields.image?.[0];
    const folder = fields.folder?.[0] || 'menu';
    const filename = fields.filename?.[0] || 'image';

    if (!image) {
      throw new Error('No image data provided');
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not configured');
    }

    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', image);
    formData.append('name', `${folder}_${filename}`);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const result = await response.json();

    if (result.success) {
      res.status(200).json({
        success: true,
        url: result.data.display_url
      });
    } else {
      throw new Error('ImgBB upload failed');
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
