import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Per-usage compression profiles — saved directly to DB as base64 WebP.
// Campaign hero/modal images are shown large (full-width hero, modal background),
// so they need a much higher resolution/quality ceiling than a product thumbnail.
const COMPRESSION_PROFILES = {
  product: { width: 900, quality: 72 },
  campaign: { width: 1920, quality: 85 },
} as const;
type UploadType = keyof typeof COMPRESSION_PROFILES;

async function compressImage(inputPath: string, type: UploadType): Promise<Buffer> {
  const { width, quality } = COMPRESSION_PROFILES[type];
  return sharp(inputPath)
    .resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
      multiples: true,
    });

    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const rawType = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    const uploadType: UploadType = rawType === 'campaign' ? 'campaign' : 'product';

    const uploadedFiles = Array.isArray(files.images) ? files.images : [files.images];
    const results: { url: string }[] = [];

    for (const file of uploadedFiles) {
      if (!file) continue;

      if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
        return res.status(400).json({
          error: `Tipo inválido: ${file.mimetype}. Permitidos: ${ALLOWED_TYPES.join(', ')}`,
        });
      }

      const buffer = await compressImage(file.filepath, uploadType);
      const base64 = `data:image/webp;base64,${buffer.toString('base64')}`;

      // Clean up temp file
      const fs = require('fs');
      fs.unlinkSync(file.filepath);

      results.push({ url: base64 });
    }

    return res.status(200).json({ images: results });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
