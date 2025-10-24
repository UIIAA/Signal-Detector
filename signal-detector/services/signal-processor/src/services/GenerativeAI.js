
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Validate GEMINI_API_KEY environment variable
if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    'CRITICAL ERROR: GEMINI_API_KEY environment variable is required. ' +
    'Please set GEMINI_API_KEY in your .env file. ' +
    'Get your API key from: https://makersuite.google.com/app/apikey'
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GenerativeAI {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generate(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      return text;
    } catch (error) {
      console.error("Error generating content:", error);
      return null;
    }
  }

  async generateStream(prompt, onChunk) {
    try {
      const result = await this.model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        const chunkText = await chunk.text();
        onChunk(chunkText);
      }
    } catch (error) {
      console.error("Error generating streaming content:", error);
      onChunk(null, error);
    }
  }
}

module.exports = GenerativeAI;
