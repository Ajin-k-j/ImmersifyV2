require('dotenv').config(); // Ensure dotenv is loaded first

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize Bedrock client with credentials from .env file
const client = new BedrockRuntimeClient({
    region: 'us-west-2', // Ensure this is the correct region for your setup
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN, // Optional: only if you're using temporary credentials
    },
});

async function identifySoundWords(text) {
    const payload = {
        anthropic_version: "bedrock-2023-05-31", // Ensure the Anthropic version is correct
        max_tokens: 200, // You can adjust max tokens as per your requirement
        top_k: 250, // You can adjust this value
        temperature: 1, // You can adjust temperature for controlling randomness
        top_p: 0.999, // Set this for controlling the diversity of the output
        messages: [
            {
                role: "user", // Role of the sender (in this case, it's the user input)
                content: [
                    {
                        type: "text", // Content type, text is used here
                        text: `Extract and return only the sound-producing words from the following sentence: "${text}". Sound-producing words include animal sounds (e.g., lion, cat), natural sounds (e.g., rain, thunder), and other sounds (e.g., baby crying, crash). Even if only the name of an animal or sound is mentioned, it should be picked up as a sound-producing word. Format the response as: Sound: [sound-producing words].`
                    }
                ]
            }
        ]
    };

    const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0', // Correct model identifier
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
    });

    try {
        const response = await client.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.body));
        
        // Check if response body contains content
        if (result?.content && result?.content[0]?.text) {
            return result.content[0].text; // Return the raw text response
        }
        
        throw new Error('Invalid or empty response from model');
    } catch (error) {
        console.error('Error invoking the model:', error);
        throw error;
    }
}

module.exports = { identifySoundWords };
