# Signal Processor Service

This service handles signal classification and processing for the Signal Detector application.

## Changes Made

1. Replaced OpenAI API with Google Gemini API for AI-based classification
2. Updated environment variables to use GEMINI_API_KEY instead of OPENAI_API_KEY
3. Modified SignalClassifier to use Gemini Flash model for classification
4. Updated transcription endpoint to use a placeholder (in production, this should use a proper speech-to-text service)

## API Endpoints

- `POST /transcribe` - Transcribes audio files (placeholder implementation)
- `POST /insights` - Generates insights based on user activities

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key

## Dependencies

- `@google/generative-ai` - Google's Generative AI SDK
- `express` - Web framework
- `multer` - Middleware for handling file uploads
- `sqlite3` - Database driver
- `dotenv` - Environment variable loader