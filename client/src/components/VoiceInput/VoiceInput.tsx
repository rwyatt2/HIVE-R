import { useState, useRef, useEffect, useCallback } from 'react';
import './VoiceInput.css';

// ============================================================================
// TYPES
// ============================================================================

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}



// Web Speech API types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResultItem;
    [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultItem {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition?: new () => SpeechRecognition;
        webkitSpeechRecognition?: new () => SpeechRecognition;
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VoiceInput({ onTranscript, onError, disabled = false }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported] = useState(true);
    const [useWhisper, setUseWhisper] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Check browser support
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setUseWhisper(true);
            console.log('Web Speech API not supported, using Whisper fallback');
        }
    }, []);

    // Initialize Web Speech API
    const initSpeechRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);

            if (event.error === 'not-allowed') {
                onError?.('Microphone access denied');
            } else if (event.error === 'network') {
                // Fall back to Whisper on network error
                setUseWhisper(true);
            } else {
                onError?.(event.error);
            }
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result) {
                    const transcript = result[0]?.transcript || '';
                    if (result.isFinal) {
                        final += transcript;
                    } else {
                        interim += transcript;
                    }
                }
            }

            setInterimTranscript(interim);

            if (final) {
                onTranscript(final.trim());
            }
        };

        return recognition;
    }, [onTranscript, onError]);

    // Start listening with Web Speech API
    const startWebSpeech = useCallback(() => {
        if (!recognitionRef.current) {
            recognitionRef.current = initSpeechRecognition();
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Failed to start speech recognition:', error);
            }
        }
    }, [initSpeechRecognition]);

    // Stop Web Speech API
    const stopWebSpeech = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    // Start recording for Whisper
    const startWhisperRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                // Send to Whisper API
                await transcribeWithWhisper(audioBlob);
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsListening(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            onError?.('Microphone access denied');
        }
    }, [onError]);

    // Stop Whisper recording
    const stopWhisperRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    }, []);

    // Transcribe with Whisper API
    const transcribeWithWhisper = async (audioBlob: Blob) => {
        try {
            setInterimTranscript('Transcribing...');

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            if (data.text) {
                onTranscript(data.text);
            }
        } catch (error) {
            console.error('Whisper transcription failed:', error);
            onError?.('Transcription failed');
        } finally {
            setInterimTranscript('');
        }
    };

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (disabled) return;

        if (isListening) {
            if (useWhisper) {
                stopWhisperRecording();
            } else {
                stopWebSpeech();
            }
        } else {
            if (useWhisper) {
                startWhisperRecording();
            } else {
                startWebSpeech();
            }
        }
    }, [isListening, useWhisper, disabled, startWebSpeech, stopWebSpeech, startWhisperRecording, stopWhisperRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    if (!isSupported && !useWhisper) {
        return null;
    }

    return (
        <div className="voice-input">
            <button
                className={`voice-button ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                disabled={disabled}
                title={isListening ? 'Stop listening' : 'Start voice input'}
            >
                {isListening ? (
                    <div className="voice-waves">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                )}
            </button>

            {interimTranscript && (
                <div className="interim-transcript">
                    {interimTranscript}
                </div>
            )}

            {useWhisper && (
                <span className="whisper-badge" title="Using Whisper for transcription">
                    Whisper
                </span>
            )}
        </div>
    );
}

export default VoiceInput;
