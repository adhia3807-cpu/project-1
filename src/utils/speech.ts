// Speech synthesis and recognition utility for the AI Advertisement Robot
// Configured with a natural, friendly, young adult female voice personality (~18 years old character)

export function speakRobotText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip emojis, code markers, markdown links, or long formatting for clean speech pronunciation
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}\u{2B05}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{200D}]/gu, '')
    .replace(/[*_~`#]/g, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/₹\s?(\d+)/g, 'Rs $1')
    .trim();

  if (!cleanText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Young female acoustic profile: energetic, warm, friendly, natural
  utterance.rate = 1.02; // natural conversational cadence
  utterance.pitch = 1.16; // pleasant young female pitch
  utterance.volume = 1.0;

  // Detect script to select appropriate localized female voice if present
  const isMalayalam = /[\u0D00-\u0D7F]/.test(text);
  const isHindi = /[\u0900-\u097F]/.test(text);
  const isTamil = /[\u0B80-\u0BFF]/.test(text);

  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();

    let femaleVoice: SpeechSynthesisVoice | undefined;

    if (isMalayalam) {
      utterance.lang = 'ml-IN';
      femaleVoice = voices.find(v => v.lang.startsWith('ml') || v.name.toLowerCase().includes('malayalam'));
    } else if (isHindi) {
      utterance.lang = 'hi-IN';
      femaleVoice = voices.find(v => (v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Lekha') || v.name.includes('Swara')));
    } else if (isTamil) {
      utterance.lang = 'ta-IN';
      femaleVoice = voices.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
    }

    // If specific language voice not found, select high-quality female English/Indian voice
    if (!femaleVoice) {
      femaleVoice = voices.find(v =>
        // High quality young/female voice candidates
        (v.name.includes('Google UK English Female') ||
         v.name.includes('Google US English') ||
         v.name.includes('Samantha') ||
         v.name.includes('Victoria') ||
         v.name.includes('Karen') ||
         v.name.includes('Zira') ||
         v.name.includes('Veena') ||
         v.name.includes('Serena') ||
         v.name.includes('Moira') ||
         v.name.includes('Tessa') ||
         v.name.toLowerCase().includes('female') ||
         v.name.toLowerCase().includes('natural')) &&
        (v.lang.startsWith('en') || v.lang.startsWith('hi') || v.lang.startsWith('ml'))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    setVoiceAndSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      setVoiceAndSpeak();
    };
  }
}

export function stopRobotSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export interface SpeechRecognitionWrapper {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognizer(
  onResult: (text: string) => void,
  onError: (err: string) => void,
  onStateChange?: (isListening: boolean) => void
): SpeechRecognitionWrapper {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => onError('Speech recognition not supported in this browser.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.lang = 'en-US';

  recognizer.onstart = () => {
    onStateChange?.(true);
  };

  recognizer.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) {
      onResult(transcript);
    }
  };

  recognizer.onerror = (event: any) => {
    onStateChange?.(false);
    onError(event.error || 'Microphone error');
  };

  recognizer.onend = () => {
    onStateChange?.(false);
  };

  return {
    start: () => {
      try {
        recognizer.start();
      } catch (e: any) {
        console.warn('Speech recognizer start error:', e);
      }
    },
    stop: () => {
      try {
        recognizer.stop();
      } catch (e: any) {
        // ignore
      }
    },
    isSupported: true,
  };
}
