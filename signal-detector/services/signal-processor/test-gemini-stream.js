require('dotenv').config({ path: '../../.env' }); // Adjust path to your .env file if needed
const GenerativeAI = require('./src/services/GenerativeAI');

async function testStream() {
  const ai = new GenerativeAI();
  const prompt = "Conte uma história curta sobre um robô que descobre a música.";

  console.log(`--- Iniciando teste de streaming para o prompt: "${prompt}" ---`);

  let fullResponse = "";
  const handleChunk = (chunk, error) => {
    if (error) {
      console.error("\n--- Erro durante o streaming ---", error);
      return;
    }
    process.stdout.write(chunk);
    fullResponse += chunk;
  };

  await ai.generateStream(prompt, handleChunk);

  console.log(`\n--- Fim do teste de streaming ---`);
  console.log("\nResposta completa recebida:", fullResponse);
}

testStream();
