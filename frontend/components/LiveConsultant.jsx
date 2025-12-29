import React, { useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, MicOff, X, MessageSquare, Loader2, Volume2 } from "lucide-react";

export const LiveConsultant = ({ fileName, fileContent, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const audioContextRef = useRef(null);
  const outputAudioContextRef = useRef(null);
  const sessionRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set());

  const decode = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes) => {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data, ctx, sampleRate, numChannels) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach((s) => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        throw new Error(
          "Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your .env.local file."
        );
      }
      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Wassila, an expert AI code reviewer. You are currently consulting with a developer about the file "${fileName}".
          The content of the file is:
          \`\`\`
          ${fileContent}
          \`\`\`
          Help the developer understand the code, identify potential improvements, and discuss architectural choices in a professional, helpful manner. Keep your responses conversational and concise since this is a voice interaction.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source =
              audioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor =
              audioContextRef.current.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: "audio/pcm;rate=16000",
              };
              sessionPromise.then((session) =>
                session.sendRealtimeInput({ media: pcmBlob })
              );
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current.destination);
          },
          onmessage: async (message) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription((prev) => [...prev, { type: "user", text }]);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription((prev) => [...prev, { type: "model", text }]);
            }

            const base64Audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                ctx.currentTime
              );
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener("ended", () =>
                sourcesRef.current.delete(source)
              );
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach((s) => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            stopSession();
          },
          onclose: () => {
            stopSession();
          },
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start session:", err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-border animate-slide-up w-full md:w-96 shadow-2xl relative z-50">
      <div className="p-4 border-b border-border flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary" size={20} />
          <h3 className="text-white font-bold text-sm">Live Consultation</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {transcription.length === 0 && !isConnecting && !isActive && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
            <Volume2 size={48} className="text-slate-700 mb-4" />
            <p className="text-sm text-slate-400">
              Discuss your code in real-time with Wassila AI.
            </p>
          </div>
        )}

        {transcription.map((t, i) => (
          <div
            key={i}
            className={`flex ${
              t.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-xs md:text-sm ${
                t.type === "user"
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-surface text-slate-300 border border-border rounded-tl-none"
              }`}
            >
              {t.text}
            </div>
          </div>
        ))}

        {isConnecting && (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-slate-900/80 backdrop-blur-md">
        {!isActive ? (
          <button
            onClick={startSession}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20"
          >
            {isConnecting ? (
              "Connecting..."
            ) : (
              <>
                <Mic size={20} /> Start Session
              </>
            )}
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Listening...
              </span>
            </div>
            <button
              onClick={stopSession}
              className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl transition-all"
            >
              <MicOff size={20} /> End Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
