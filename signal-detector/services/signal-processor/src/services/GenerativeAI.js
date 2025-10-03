
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
}

module.exports = GenerativeAI;
