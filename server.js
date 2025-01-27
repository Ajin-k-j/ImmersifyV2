const express = require('express');
const bodyParser = require('body-parser');
const { identifySoundWords } = require('./utils/awsModel');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

let soundCache = {}; // In-memory cache for sound-producing words

// API to process text and identify sound-producing words
app.post('/api/identify-sounds', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const words = text.split(/\s+/).map(w => w.toLowerCase());
    const uncachedWords = words.filter(word => !soundCache[word]);

    let sounds = [];
    let sentiment = 'neutral'; // Default sentiment

    try {
        // If there are uncached words, process them with AWS Bedrock
        if (uncachedWords.length > 0) {
            const response = await identifySoundWords(uncachedWords.join(' '));

            // Adjust the regex to match just the sound-producing words
            const match = response.match(/Sound: ([^,]+)(?:, Sentiment: (.*))?/);

            if (match) {
                // Extract sound-producing words and remove unnecessary spaces
                const foundSounds = match[1].split(',').map(w => w.trim());

                // If Sentiment exists, assign it
                sentiment = match[2] ? match[2].trim() : sentiment;

                // Update cache with the new sounds
                foundSounds.forEach(sound => {
                    soundCache[sound] = true;
                    sounds.push(sound);
                });
            }
        }

        // Add cached sounds for the input text
        sounds = [
            ...new Set([
                ...sounds,
                ...words.filter(word => soundCache[word])
            ])
        ];

        
        sounds.forEach(sound => console.log(sound));

        res.json({ sounds, sentiment });
    } catch (error) {
        console.error('Error:', error.message || error);
        res.status(500).json({ error: 'Failed to identify sounds' });
    }
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
