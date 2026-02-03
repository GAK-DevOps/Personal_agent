// Voice fix - add this to enable speech and handle browser restrictions
function fixVoiceSynthesis() {
    if (window.speechSynthesis) {
        // Force load voices
        window.speechSynthesis.getVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
        }

        // Browsers block speech until a user interaction (click/tap)
        const unlockSpeech = () => {
            const utterance = new SpeechSynthesisUtterance(' ');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
            console.log('🔊 Speech synthesis unlocked');
            window.removeEventListener('click', unlockSpeech);
            window.removeEventListener('touchstart', unlockSpeech);
        };

        window.addEventListener('click', unlockSpeech);
        window.addEventListener('touchstart', unlockSpeech);

        // Override the speak method for the agent
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (typeof agent !== 'undefined' && agent) {
                    agent.speak = function (text) {
                        if (!window.speechSynthesis || !this.settings.enableVoiceResponse) {
                            return;
                        }

                        // Cancel any ongoing speech
                        window.speechSynthesis.cancel();

                        // Short delay helps some browsers (like Safari) process the cancel
                        setTimeout(() => {
                            const utterance = new SpeechSynthesisUtterance(text);
                            utterance.rate = 1.0;
                            utterance.pitch = 1.0;
                            utterance.volume = 1.0;
                            utterance.lang = 'en-US';

                            const voices = window.speechSynthesis.getVoices();
                            if (voices.length > 0) {
                                // Try to find a nice female voice for Lokha
                                const voice = voices.find(v =>
                                    v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Female'))
                                ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
                                utterance.voice = voice;
                            }

                            utterance.onstart = () => console.log('🔊 Lokha Speaking:', text.substring(0, 50) + '...');
                            utterance.onerror = (e) => console.error('Speech error:', e);

                            window.speechSynthesis.speak(utterance);
                        }, 50);
                    };

                    console.log('✅ Lokha voice system ready!');
                }
            }, 1000);
        });
    }
}

fixVoiceSynthesis();
