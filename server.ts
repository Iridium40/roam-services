import express from 'express';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Demo Server is running!' });
});

// AI chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY not found in environment variables' 
      });
    }

    console.log('🤖 Processing AI request:', prompt);

    // Generate text using Claude
    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307', {
        apiKey: process.env.ANTHROPIC_API_KEY,
      }),
      prompt: prompt,
      maxTokens: 500,
    });

    console.log('✅ AI Response generated');

    res.json({
      success: true,
      response: result.text,
      usage: result.usage
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve a simple HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI SDK Demo</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #333;
                text-align: center;
                margin-bottom: 30px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #555;
            }
            textarea {
                width: 100%;
                height: 100px;
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-family: inherit;
                resize: vertical;
            }
            button {
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
            }
            button:hover {
                background: #0056b3;
            }
            button:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .response {
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 5px;
                border-left: 4px solid #007bff;
                white-space: pre-wrap;
            }
            .loading {
                text-align: center;
                color: #666;
                font-style: italic;
            }
            .error {
                color: #dc3545;
                background: #f8d7da;
                border-left-color: #dc3545;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 AI SDK Demo</h1>
            <div class="form-group">
                <label for="prompt">Ask Claude anything:</label>
                <textarea id="prompt" placeholder="Enter your question or prompt here...">Hello! Please give me a brief, friendly introduction about yourself.</textarea>
            </div>
            <button onclick="sendMessage()" id="sendBtn">Send Message</button>
            <div id="response"></div>
        </div>

        <script>
            async function sendMessage() {
                const prompt = document.getElementById('prompt').value;
                const sendBtn = document.getElementById('sendBtn');
                const responseDiv = document.getElementById('response');
                
                if (!prompt.trim()) {
                    alert('Please enter a prompt');
                    return;
                }
                
                sendBtn.disabled = true;
                sendBtn.textContent = 'Sending...';
                responseDiv.innerHTML = '<div class="loading">🤖 Claude is thinking...</div>';
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ prompt })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        responseDiv.innerHTML = '<div class="response"><strong>Claude:</strong>\\n' + data.response + '</div>';
                    } else {
                        responseDiv.innerHTML = '<div class="response error"><strong>Error:</strong>\\n' + data.error + '</div>';
                    }
                } catch (error) {
                    responseDiv.innerHTML = '<div class="response error"><strong>Error:</strong>\\n' + error.message + '</div>';
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send Message';
                }
            }
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 AI Demo Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
