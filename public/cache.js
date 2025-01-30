document.addEventListener('DOMContentLoaded', () => {
    const contextInput = document.getElementById('context-input');
    const genStoryBtn = document.getElementById('genStory-btn');
    const statusText = document.createElement('p');
    statusText.textContent = "Generating your story...";
    statusText.style.display = "none"; // Initially hidden
    document.body.appendChild(statusText);

    // Event listener for the "Generate Story" button
    genStoryBtn.addEventListener('click', handleGenStoryClick);

    // Function to handle the button click and call the backend
    async function handleGenStoryClick() {
        const context = contextInput.value.trim();
        const soundWords = ["lion", "thunder", "baby crying", "rain"]; // List of sound-producing words

        // Show the "Generating your story..." text while the story is being generated
        statusText.style.display = "block";

        try {
            const data = await generateStory(context, soundWords);

            // Save the generated story in localStorage
            localStorage.setItem('processedStory', data.story);

            // Redirect to the 'read.html' page to display the story
            window.location.href = 'read.html';
        } catch (error) {
            console.error('Error generating story:', error);
            alert('Something went wrong, please try again.');
        } finally {
            // Hide the generating message once the process is finished
            statusText.style.display = "none";
        }
    }

    // Function to send context and soundWords to the server to generate the story
    async function generateStory(context, soundWords) {
        const response = await fetch('/genStory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context })
        });

        if (!response.ok) {
            throw new Error('Failed to generate story');
        }

        return response.json();
    }
});
