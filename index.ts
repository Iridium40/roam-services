import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🤖 Starting AI demo...');
    
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
      console.log('💡 Please create a .env file with your Anthropic API key:');
      console.log('   ANTHROPIC_API_KEY=your_api_key_here');
      return;
    }

    // Generate text using Claude
    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      prompt: 'Hello! Please give me a brief, friendly introduction about yourself.',
      maxTokens: 100,
    });

    console.log('✅ AI Response:');
    console.log(result.text);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
