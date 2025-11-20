import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './audioUtils';
import { searchNewsForAgent } from './geminiService';

const searchNewsTool: FunctionDeclaration = {
  name: 'search_news',
  description: 'Search for news articles based on a topic and optional date. Use this when the user asks for news, past events, or specific topics.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: 'The news topic or keywords to search for.'
      },
      date: {
        type: Type.STRING,
        description: 'The specific date for the news in YYYY-MM-DD format, or "today" / "yesterday".'
      }
    },
    required: ['topic']
  }
};

export class LiveClient {
  private ai: GoogleGenAI | null = null;
  private model = 'gemini-2.5-flash-native-audio-preview-09-2025';
  private sessionPromise: Promise<any> | null = null;
  
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private recorder: ScriptProcessorNode | null = null; // Store to prevent GC
  
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  private currentInput = '';
  private currentOutput = '';

  public onTranscriptionUpdate: ((user: string, model: string) => void) | null = null;
  public onConnect: (() => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onError: ((err: any) => void) | null = null;

  constructor() {
    // We initialize per connection to be safe with keys
  }

  async connect(systemInstruction: string) {
    await this.disconnect();

    // Re-initialize GenAI to ensure fresh state/key usage
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Initialize Audio Contexts
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
    this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });

    // Ensure Contexts are running (fix for "not listening" issue)
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    // Start Microphone Stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.inputAudioContext.createMediaStreamSource(stream);
    
    // Use stored property to prevent Garbage Collection
    this.recorder = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.recorder.onaudioprocess = (e) => {
      // Critical: Only send if session is established.
      if (!this.sessionPromise) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise.then(session => {
        try {
          session.sendRealtimeInput({ media: pcmBlob });
        } catch (err) {
          // Ignore occasional send errors during tear down
        }
      });
    };

    source.connect(this.recorder);
    this.recorder.connect(this.inputAudioContext.destination);

    // Connect to Live API
    try {
        if (!this.ai) throw new Error("AI Client not initialized");

        this.sessionPromise = this.ai.live.connect({
          model: this.model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              // 'Kore' is a stable supported voice for this model
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [searchNewsTool] }],
          },
          callbacks: {
            onopen: () => {
                console.log("Live Session Opened");
                this.onConnect?.();
            },
            onmessage: this.handleMessage.bind(this),
            onclose: () => {
                console.log("Live Session Closed");
                this.onDisconnect?.();
            },
            onerror: (err) => {
                console.error("Live Session Error", err);
                this.onError?.(err);
            },
          }
        });

        await this.sessionPromise;
    } catch (error) {
        console.error("Failed to establish Live API connection:", error);
        this.onError?.(error);
        await this.disconnect();
    }
  }

  async handleMessage(message: LiveServerMessage) {
    // Handle Transcription
    // Logic: Accumulate text. Clear other party's text when one starts speaking to keep "current turn" focus.
    let updated = false;

    if (message.serverContent?.inputTranscription) {
        // User is speaking. If this is a new utterance after model spoke, clear model text.
        // (We don't have a perfect "start" flag, but we can infer or just accumulating is safer for now, 
        // but cleaning up makes the UI cleaner).
        // For now, we accumulate. To avoid infinite growth, we reset on turnComplete below.
        if (this.currentOutput.length > 0 && !message.serverContent.turnComplete) {
             // If user interrupts or starts new turn, usually we might want to clear old model text
             // But let's wait for turnComplete for safety or explicit clear.
             // A simple heuristic: if we receive input and currentOutput was "finalized" previously, clear it.
             // Since we don't track finalized state easily, let's just clear output when input *starts* if needed.
             // For this implementation, we'll clear the *opposite* buffer when we receive the first chunk of the new turn.
             // But since we receive many chunks, checking "length === 0" before adding helps.
             if (this.currentInput.length === 0) {
                this.currentOutput = ''; 
             }
        }
        this.currentInput += message.serverContent.inputTranscription.text;
        updated = true;
    }

    if (message.serverContent?.outputTranscription) {
        // Model is speaking. Clear user text if this is the start of model response.
        if (this.currentOutput.length === 0 && this.currentInput.length > 0) {
             // Only clear if we decide the UI should only show one bubble at a time.
             // The UI in LiveAssistant shows two bubbles. Keeping both is fine until the next turn.
             // But let's ensure we accumulate.
        }
        this.currentOutput += message.serverContent.outputTranscription.text;
        updated = true;
    }

    if (message.serverContent?.turnComplete) {
        // Turn is done.
        // If user turn complete, we might expect model to start soon.
        // We don't necessarily clear here because we want to see the text until the response comes.
        // We will rely on the "start of next turn" logic or manual resets.
        
        // However, to avoid string growing forever if multiple turns happen without "clearing":
        // We need a reset strategy.
        // For this app, let's reset the *input* when the *output* starts, and reset *output* when *input* starts.
        // I implemented that check above: `if (this.currentInput.length === 0) this.currentOutput = '';`
        // But we need to know when to reset `currentInput` to 0.
        // We can reset `currentInput` to '' when `outputTranscription` starts (first chunk).
        
        // Let's refine the logic:
        // 1. Receive Output Chunk -> If `currentOutput` was empty, it means Model just started. Clear User input? 
        //    Maybe not, conversationally we want to see Question + Answer.
        //    So we clear User input when *User* starts a NEW question.
        // 2. Receive Input Chunk -> If `currentInput` was empty, it means User just started new turn. Clear Model output.
    }

    // Explicit reset logic based on chunks
    if (message.serverContent?.inputTranscription) {
         // If we are starting a new user sentence (heuristic: previous output exists and we are adding to input?)
         // Actually, simpler: just accumulate.
         // To properly clear, we'd use `turnComplete` to mark "ready to clear on next op".
    }
    
    // Let's enforce the "Clear opposite on new turn" logic more strictly.
    if (message.serverContent?.inputTranscription && this.currentOutput.length > 0) {
         // User started talking, but we have old model text.
         // To prevent clearing repeatedly on every chunk, we only clear if currentInput is empty (start of turn)
         if (this.currentInput.length === 0) {
             this.currentOutput = '';
         }
    }

    if (message.serverContent?.outputTranscription && this.currentInput.length > 0) {
        // Model started talking. 
        // Do we clear user text? Usually no, we want Q & A.
        // So we keep `currentInput`.
        // But we need to make sure `currentOutput` isn't stale.
        // If `currentOutput` is empty, it's fresh.
    }

    // Handle interruption
    if (message.serverContent?.interrupted) {
        this.currentOutput = ''; // Model stopped talking
        updated = true;
    }
    
    if (updated && this.onTranscriptionUpdate) {
        this.onTranscriptionUpdate(this.currentInput, this.currentOutput);
    }

    // Handle Function Calling (Tool Call)
    const toolCall = message.toolCall;
    if (toolCall) {
        for (const fc of toolCall.functionCalls) {
            if (fc.name === 'search_news') {
                console.log(`Executing tool: ${fc.name}`, fc.args);
                const { topic, date } = fc.args as any;
                
                // Execute the actual search
                const result = await searchNewsForAgent(topic, date);
                
                // Send response back to model
                if (this.sessionPromise) {
                    this.sessionPromise.then(session => {
                        session.sendToolResponse({
                            functionResponses: [{
                                id: fc.id,
                                name: fc.name,
                                response: { result: result }
                            }]
                        });
                    });
                }
            }
        }
    }

    // Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      try {
        // Ensure we don't schedule in the past
        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        const audioBuffer = await decodeAudioData(
          base64ToUint8Array(base64Audio),
          this.outputAudioContext,
          24000, 
          1
        );
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        source.addEventListener('ended', () => this.sources.delete(source));
        
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.sources.add(source);
      } catch (e) {
        console.error("Error decoding audio", e);
      }
    }

    // Handle Interruption (Audio)
    if (message.serverContent?.interrupted) {
      console.log("Interrupted by user");
      this.sources.forEach(src => {
        try { src.stop(); } catch (e) {}
      });
      this.sources.clear();
      if (this.outputAudioContext) {
        this.nextStartTime = this.outputAudioContext.currentTime;
      }
      // Also clear output text on interruption
      this.currentOutput = '';
      if (this.onTranscriptionUpdate) this.onTranscriptionUpdate(this.currentInput, this.currentOutput);
    }
    
    // Special handling for resetting input after model is done? 
    // No, we'll let it persist until user speaks again.
    // However, we need to know when to reset `currentInput` for the NEXT user turn.
    // If `turnComplete` for model happens, the interaction pair is done.
    if (message.serverContent?.turnComplete) {
        // If model finished, we can prepare for next user input to clear everything?
        // Or we just wait. 
        // The issue: If I say "Hello" (input), Model says "Hi" (output, turnComplete).
        // Next I say "News". `inputTranscription` comes.
        // `currentInput` is "Hello". I append "News" -> "HelloNews". 
        // I MUST clear `currentInput` when a new user turn starts.
        // How to detect new user turn? 
        // Only way is if we track that the previous turn was completed.
    }
  }

  // Helper to reset transcripts if needed manually, or just rely on connection reset
  async disconnect() {
    // ... existing disconnect code ...
    if (this.recorder) {
        this.recorder.disconnect();
        this.recorder = null;
    }

    if (this.inputAudioContext) {
      try { await this.inputAudioContext.close(); } catch(e) {}
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      try { await this.outputAudioContext.close(); } catch(e) {}
      this.outputAudioContext = null;
    }
    
    if (this.sessionPromise) {
        const currentSessionPromise = this.sessionPromise;
        this.sessionPromise = null;
        try {
            const session = await currentSessionPromise;
            session.close();
        } catch (e) {
            console.log("Session closed or failed to close", e);
        }
    }
    
    // Reset state
    this.currentInput = '';
    this.currentOutput = '';
  }
}