# 🤖 ROAM AI CLI Chat Interface

A command-line interface for chatting with Claude Opus 4 using the Vercel AI Gateway.

## 🚀 Quick Start

### 1. Make sure you have the environment variables set up:
```bash
# In your .env.local file
AI_GATEWAY_API_KEY=AMk4EoHhZgcmtuALLZHerMNH
ANTHROPIC_API_KEY=AMk4EoHhZgcmtuALLZHerMNH
```

### 2. Run the CLI chat interface:
```bash
npm run chat
```

### 3. Start chatting!
```
🤖 ROAM AI CLI Chat Interface
Connected to Claude Opus 4 via Vercel AI Gateway
Type your messages below. Press Ctrl+C to exit.

You: Hello, can you help me with ROAM services?
Assistant: Hello! I'd be happy to help you with ROAM services...
```

## ✨ Features

- **🧠 Claude Opus 4**: Latest and most capable Claude model
- **⚡ Real-time Streaming**: See responses as they're generated
- **💬 Persistent Context**: Conversation history maintained throughout session
- **🔗 Vercel AI Gateway**: Optimized routing and caching
- **🎨 Clean Interface**: Simple and intuitive command-line experience

## 🛠️ Technical Details

### Model Configuration
- **Model**: `anthropic/claude-opus-4-20250514`
- **Streaming**: Real-time text streaming
- **Context**: Full conversation history maintained
- **API**: Vercel AI Gateway with optional API key

### Code Structure
```typescript
// index.ts - Main CLI interface
import { ModelMessage, streamText } from 'ai';
import 'dotenv/config';
import * as readline from 'node:readline/promises';

// Maintains conversation history
const messages: ModelMessage[] = [];

// Streaming text generation
const result = streamText({
  model: 'anthropic/claude-opus-4-20250514',
  messages,
});
```

## 🎯 Use Cases

### Development & Testing
- Test Claude Opus 4 responses locally
- Experiment with conversation flows
- Debug AI integration issues
- Rapid prototyping of chat experiences

### Business Applications
- Customer service testing
- Content generation workflows
- Training data collection
- Internal team assistance

### ROAM-Specific Features
- Test ROAM platform knowledge
- Validate booking assistance responses
- Check provider recommendation logic
- Verify role-based response patterns

## 🔧 Customization

### Modify the Model
```typescript
const result = streamText({
  model: 'anthropic/claude-3-5-sonnet-20241022', // Change model
  messages,
  temperature: 0.7, // Add parameters
  maxTokens: 1000,
});
```

### Add System Prompts
```typescript
// Add to messages array initialization
const messages: ModelMessage[] = [
  {
    role: 'system',
    content: 'You are a ROAM AI assistant specialized in wellness services...'
  }
];
```

### Enhanced Logging
```typescript
// Add before streaming
console.log(`🔍 Sending ${messages.length} messages to Claude Opus 4`);
console.log(`📝 User input: "${userInput}"`);
```

## 🚨 Troubleshooting

### Common Issues

1. **"Model not found" error**:
   - Ensure AI_GATEWAY_API_KEY is set correctly
   - Verify Vercel AI Gateway is enabled
   - Check model name spelling

2. **No streaming output**:
   - Verify internet connection
   - Check API key validity
   - Ensure dotenv is loading properly

3. **Environment variables not loading**:
   - Confirm .env.local file exists
   - Check file is in project root
   - Restart terminal session

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run chat
```

## 📊 Monitoring

### Usage Tracking
- Monitor API usage in Vercel dashboard
- Track conversation lengths and patterns
- Analyze response quality and latency

### Performance Metrics
- Response time measurement
- Token usage optimization
- Streaming efficiency analysis

## 🎉 Ready to Chat!

Your CLI interface is now set up with Claude Opus 4. Simply run `npm run chat` to start an intelligent conversation with the most advanced AI model available!

**Perfect for**: Development, testing, training, and exploring the full capabilities of Claude Opus 4 in a simple command-line environment.
