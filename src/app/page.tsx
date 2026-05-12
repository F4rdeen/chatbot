"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Language, LANGUAGES, Message, getLanguageConfig } from "@/lib/languages";
import { speak, stopSpeaking } from "@/lib/speech";
import { generateId } from "@/lib/utils";

function buildGreetingMessage(language: Language): Message {
  const config = getLanguageConfig(language);
  return {
    id: generateId(),
    role: "assistant",
    content: config.greeting,
    language,
    timestamp: new Date(),
  };
}

export default function ChatPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [messages, setMessages] = useState<Message[]>(() => [
    buildGreetingMessage("en"),
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const langConfig = getLanguageConfig(language);

  function handleLanguageChange(nextLanguage: Language) {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    setMessages([buildGreetingMessage(nextLanguage)]);
    setInput("");
    stopSpeaking();
    setSpeaking(null);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || loading) return;
      setInput("");

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: userText,
        language,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, language }),
        });

        const data = await res.json();
        const reply: string = data.reply ?? "Sorry, something went wrong.";

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: reply,
          language,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-speak assistant reply
        handleSpeak(assistantMsg.id, reply, language);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: "Connection error. Please try again.",
            language,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, messages, language, loading]
  );

  function handleSpeak(id: string, text: string, lang: Language) {
    stopSpeaking();
    if (speaking === id) {
      setSpeaking(null);
      return;
    }
    setSpeaking(id);
    speak(text, lang, () => setSpeaking(null));
  }

  function startListening() {
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = langConfig.voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow">
              AI
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-tight">
                Multilingual Chatbot
              </h1>
              <p className="text-xs text-gray-500">
                English · Bahasa Melayu · தமிழ் · Manglish
              </p>
            </div>
          </div>
          {/* Online indicator */}
          <div className="flex items-center gap-2 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </div>
        </div>

        {/* Language selector */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                language === lang.code
                  ? "bg-indigo-600 text-white shadow-md scale-105"
                  : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            speaking={speaking === msg.id}
            onSpeak={() => handleSpeak(msg.id, msg.content, msg.language)}
          />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 max-w-xs">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-100 sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            {/* Microphone */}
            <button
              onClick={isListening ? stopListening : startListening}
              title={isListening ? "Stop listening" : "Voice input"}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500 text-white shadow-lg animate-pulse"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {isListening ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
                </svg>
              )}
            </button>

            {/* Text input */}
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={langConfig.placeholder}
              className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all overflow-hidden"
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
              title="Send"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-2">
            Powered by HuggingFace AI · Web Speech API · Free & Open
          </p>
        </div>
      </footer>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  speaking: boolean;
  onSpeak: () => void;
}

function MessageBubble({ message, speaking, onSpeak }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1 shadow">
          AI
        </div>
      )}
      <div className="max-w-[75%] flex flex-col gap-1">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
          }`}
        >
          {message.content}
        </div>
        <div
          className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}
        >
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {!isUser && (
            <button
              onClick={onSpeak}
              title={speaking ? "Stop speaking" : "Listen"}
              className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
                speaking
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 opacity-0 group-hover:opacity-100"
              }`}
            >
              {speaking ? (
                <>
                  <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  Listen
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 mt-1 shadow">
          You
        </div>
      )}
    </div>
  );
}
