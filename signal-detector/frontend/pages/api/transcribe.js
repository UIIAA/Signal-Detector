import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure multer for file uploads
const upload = multer({ dest: '/tmp/' });

// Helper function to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('audio'));

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    // Note: In a production environment, we would use a dedicated speech-to-text service
    // such as Google Cloud Speech-to-Text or similar for actual audio transcription.
    // For this prototype, we're using a placeholder.
    const transcription = "Transcription placeholder - In production, this would use Google Cloud Speech-to-Text or similar service";

    // Clean up the uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }

    // For now, just return the transcription
    res.json({ transcription: transcription });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Error transcribing audio' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};