const startStopButton = document.getElementById('startStopButton');
const output = document.getElementById('output');
const sentimentDiv = document.getElementById('sentiment');

let isListening = false;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
let alreadyHighlightedText = "";
var processedTranscriptsArray = [];

// Local cache for sound-producing words
let soundCache = {};

// Update displayed text with highlights
function highlightSoundWords(text) {
    const words = text.split(/\s+/).map(word => {
        const cleanWord = word.toLowerCase().replace(/[.,!?]$/, '');
        if (soundCache[cleanWord]) {
            return `<span class="sound-word" onclick="playSound('${soundCache[cleanWord]}')">${word}</span>`;
        }
        return word;
    });
    output.innerHTML = words.join(' ');
}

// Play sound associated with a word
function playSound(soundFile) {
    const audio = new Audio(`/sounds/${soundFile}.wav`);
    audio.play();
}

function getTranscriptData(transcript) {
    var transcriptData = "";
    Array.from(event.results).forEach(speechRecognitionResult => {
        if (speechRecognitionResult.isFinal)
        {
            transcriptData = speechRecognitionResult[0].transcript;
            transcriptData = transcriptData.replace(alreadyHighlightedText, "");
            alreadyHighlightedText = transcriptData.length === 0 ? alreadyHighlightedText : transcriptData;
            if (transcriptData.length > 0 && !processedTranscriptsArray.includes(transcriptData))
            {
                console.log("Sound recog text = " + transcriptData);
                processedTranscriptsArray.push(transcriptData);
            }            
        }
    });
    return transcriptData;
}


// Handle speech recognition results
recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join(' ');

    var transcriptData = getTranscriptData(event);    
    
    if (transcriptData.length > 0) {
        // Highlight locally cached words
        highlightSoundWords(transcriptData);

        // Send to backend for additional processing
        fetch('/api/identify-sounds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcriptData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sounds) {
                data.sounds.forEach(word => {
                    soundCache[word] = word; // Cache the word for future use
                });
            }

            // Update highlights and sentiment
            highlightSoundWords(transcriptData);
            sentimentDiv.textContent = `Sentiment: ${data.sentiment}`;
        })
        .catch(err => console.error('Error identifying sounds:', err));
    }
    
};

// Start/Stop listening
startStopButton.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
        isListening = false;
        alreadyHighlightedText = "";
        processedTranscriptsArray = [];
        startStopButton.textContent = 'Start Listening';
    } else {
        recognition.start();
        isListening = true;
        startStopButton.textContent = 'Stop Listening';
    }
});