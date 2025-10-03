import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Helper function to convert audio file to base64
function fileToBase64(filePath) {
  const file = fs.readFileSync(filePath);
  return file.toString('base64');
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

    console.log('Audio file received:', req.file);

    try {
      // Read the audio file
      const audioData = fileToBase64(req.file.path);

      // Determine mime type based on file extension or original name
      const mimeType = req.file.mimetype || 'audio/webm';

      console.log('Using Gemini API for transcription...');

      // Use Gemini 2.0 Flash for audio transcription
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: audioData
          }
        },
        {
          text: "Transcreva este áudio em português brasileiro. Retorne APENAS o texto transcrito, sem adicionar comentários, introduções ou conclusões. Se o áudio não contiver fala clara, retorne: 'Não foi possível transcrever o áudio.'"
        }
      ]);

      const response = await result.response;
      const transcription = response.text();

      console.log('Transcription successful:', transcription.substring(0, 100) + '...');

      // Clean up the uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      res.json({ transcription: transcription.trim() });

    } catch (aiError) {
      console.error('Error with Gemini API:', aiError);

      // Fallback: return a helpful message
      const fallbackTranscription = "Descreva brevemente a atividade que você realizou (a transcrição automática encontrou dificuldades)";

      res.json({
        transcription: fallbackTranscription,
        warning: 'Transcrição automática indisponível. Por favor, descreva manualmente sua atividade.'
      });
    }

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Error transcribing audio: ' + error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
