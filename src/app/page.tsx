"use client";

import { ChangeEvent, MutableRefObject, useEffect, useRef, useState } from "react";
import { Paperclip, Star } from "lucide-react";
import AvatarViewport from "@/components/AvatarViewport";
import InteractionBar from "@/components/InteractionBar";
import MainLayout from "@/components/MainLayout";
import SubtitleSystem from "@/components/SubtitleSystem";

type SubtitlePair = {
  eng: string;
  ru: string;
};

type TabMode = "chat" | "live";

type VisionAsset = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
};

type ChatRecord = {
  id: string;
  mode: TabMode;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  visionFiles?: VisionAsset[];
};

type UserProfile = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  weakPoints: string[];
  learnedWords: string[];
};

const DEFAULT_SUBTITLES: SubtitlePair = {
  eng: "Hello! Let's practice pronunciation together.",
  ru: "Привет! Давай вместе потренируем произношение.",
};

const DEFAULT_PROFILE: UserProfile = {
  totalXp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpToNextLevel: 100,
  weakPoints: [],
  learnedWords: [],
};

const ASSISTANT_SUBTITLE_PREFIX = "Assistant:";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabMode>("chat");
  const [isListening, setIsListening] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [liveInput, setLiveInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatRecord[]>([]);
  const [visionAssets, setVisionAssets] = useState<VisionAsset[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [currentSubtitles, setCurrentSubtitles] =
    useState<SubtitlePair>(DEFAULT_SUBTITLES);
  const [isUpdatingSubs, setIsUpdatingSubs] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const historyRef = useRef<ChatRecord[]>([]);
  const hasInjectedReviewRef = useRef(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const clearTimeoutRef = (
    timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const updateSubs = (nextSubtitles: SubtitlePair) => {
    clearTimeoutRef(transitionTimeoutRef);

    setIsUpdatingSubs(true);
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentSubtitles(nextSubtitles);
      setIsUpdatingSubs(false);
    }, 220);
  };

  const appendHistory = (record: Omit<ChatRecord, "id" | "createdAt">) => {
    const entry: ChatRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...historyRef.current, entry];
    historyRef.current = nextHistory;
    setChatHistory(nextHistory);

    return nextHistory;
  };

  const submitProgressEvent = async (
    type: "sentence_mastered" | "vision_reviewed" | "mistake_detected",
    content?: string,
  ) => {
    try {
      const response = await fetch("/api/profile/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, content }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as UserProfile;
      setProfile(payload);
    } catch {
      // no-op: progress should not block conversation flow
    }
  };

  const buildAssistantPayload = (history: ChatRecord[]) => {
    return history.map((item) => ({
      role: item.role,
      content: item.content,
      visionFiles: item.visionFiles?.map((file) => ({
        name: file.name,
        mimeType: file.mimeType,
        dataUrl: file.dataUrl,
      })),
    }));
  };

  const requestAssistant = async (mode: TabMode, history: ChatRecord[]) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setIsAssistantSpeaking(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: buildAssistantPayload(history),
        }),
      });

      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "Assistant request failed");
      }

      const assistantHistory = appendHistory({
        mode,
        role: "assistant",
        content: payload.reply,
      });

      if (/mistake|ошибк/i.test(payload.reply)) {
        void submitProgressEvent("mistake_detected", payload.reply.slice(0, 120));
      }

      if (mode === "live") {
        const assistantMessage = assistantHistory[assistantHistory.length - 1];
        updateSubs({
          eng: `${ASSISTANT_SUBTITLE_PREFIX} ${assistantMessage.content}`,
          ru: "Повтори это вслух и закрепи материал.",
        });
      }

      clearTimeoutRef(speakingTimeoutRef);
      speakingTimeoutRef.current = setTimeout(() => {
        setIsAssistantSpeaking(false);
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown assistant error.";
      setErrorMessage(message);
      setIsAssistantSpeaking(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendChatMessage = async (message: string, mode: TabMode) => {
    const normalized = message.trim();
    if (!normalized) {
      return;
    }

    const nextHistory = appendHistory({
      mode,
      role: "user",
      content: normalized,
    });

    if (mode === "live") {
      updateSubs({
        eng: normalized,
        ru: `Временный перевод: ${normalized}`,
      });
      void submitProgressEvent("sentence_mastered", normalized);
    }

    await requestAssistant(mode, nextHistory);
  };

  const handleChatSend = async () => {
    const message = chatInput;
    setChatInput("");
    await sendChatMessage(message, "chat");
  };

  const handleLiveSend = async () => {
    const message = liveInput;
    setLiveInput("");
    await sendChatMessage(message, "live");
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch("/api/whisper", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as { text?: string; error?: string };
    if (!response.ok || !payload.text) {
      throw new Error(payload.error || "Whisper transcription failed.");
    }

    return payload.text;
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsListening(false);
  };

  const toggleListening = async () => {
    if (isListening) {
      stopRecording();
      return;
    }

    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        try {
          const transcript = await transcribeAudio(audioBlob);
          setLiveInput(transcript);
          await sendChatMessage(transcript, "live");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Voice processing failed.";
          setErrorMessage(message);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch {
      setErrorMessage("Microphone access denied or unavailable.");
      setIsListening(false);
    }
  };

  const fileToDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Failed to read file as data URL."));
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  };

  const handleVisionUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    try {
      const uploadedAssets: VisionAsset[] = await Promise.all(
        files.map(async (file) => ({
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          dataUrl: await fileToDataUrl(file),
          createdAt: new Date().toISOString(),
        })),
      );

      setVisionAssets((prevState) => [...prevState, ...uploadedAssets]);

      const nextHistory = appendHistory({
        mode: "chat",
        role: "user",
        content: `Attached vision files: ${uploadedAssets.map((file) => file.name).join(", ")}`,
        visionFiles: uploadedAssets,
      });

      void submitProgressEvent("vision_reviewed", uploadedAssets.map((file) => file.name).join(", "));
      await requestAssistant("chat", nextHistory);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vision upload failed.";
      setErrorMessage(message);
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    const bootstrapProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as UserProfile;
        setProfile(payload);

        if (!hasInjectedReviewRef.current && (payload.weakPoints.length || payload.learnedWords.length)) {
          hasInjectedReviewRef.current = true;
          appendHistory({
            mode: "chat",
            role: "assistant",
            content: `Review focus: ${payload.weakPoints.slice(0, 2).join("; ") || "pronunciation"}. Learned words: ${payload.learnedWords.slice(0, 3).join(", ") || "none yet"}.`,
          });
        }
      } catch {
        // ignore bootstrap fetch errors
      }
    };

    void bootstrapProfile();
  }, []);

  useEffect(() => {
    return () => {
      clearTimeoutRef(transitionTimeoutRef);
      clearTimeoutRef(speakingTimeoutRef);
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const progressPercent = Math.min(100, Math.round((profile.xpIntoLevel / profile.xpToNextLevel) * 100));

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="glass-panel relative flex w-fit rounded-xl p-1">
            <div
              className={`absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-lg bg-cyan-300/85 transition-transform duration-300 ${
                activeTab === "chat" ? "translate-x-0" : "translate-x-[calc(100%+0.5rem)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`relative z-10 rounded-lg px-4 py-2 text-sm transition ${
                activeTab === "chat" ? "text-black" : "text-zinc-300"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("live")}
              className={`relative z-10 rounded-lg px-4 py-2 text-sm transition ${
                activeTab === "live" ? "text-black" : "text-zinc-300"
              }`}
            >
              Live Practice
            </button>
          </div>

          <aside className="glass-panel min-w-44 rounded-xl p-3">
            <div className="flex items-center gap-2 text-cyan-200">
              <Star className="h-4 w-4" />
              <p className="text-sm font-medium">Level {profile.level}</p>
            </div>
            <p className="mt-1 text-xs text-zinc-300">XP: {profile.xpIntoLevel}/{profile.xpToNextLevel}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
              <div className="h-full bg-cyan-300 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </aside>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {activeTab === "chat" ? (
          <section className="glass-panel flex flex-1 flex-col gap-4 rounded-2xl p-4">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-zinc-100">Shared History</h2>
              <div className="glass-panel max-h-72 space-y-2 overflow-y-auto rounded-xl p-3">
                {chatHistory.length ? (
                  chatHistory.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-lg border border-white/10 bg-black/25 p-2"
                    >
                      <p className="text-xs uppercase tracking-wide text-zinc-400">
                        {record.mode === "chat" ? "Chat" : "Live Practice"} • {record.role}
                      </p>
                      <p className="text-sm text-zinc-100">{record.content}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">No messages yet.</p>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-xl p-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100 transition hover:border-cyan-300/50">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handleVisionUpload}
                />
              </label>
              <p className="mt-2 text-xs text-zinc-400">
                Attach screenshots or textbook photos. They are shared with Live Practice.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Review queue: {profile.weakPoints.slice(0, 2).join(" • ") || "No weak points yet"}
              </p>
            </div>

            <div className="mt-auto flex items-center gap-3">
              <div className="glass-panel flex-1 rounded-xl bg-black/35 px-1 shadow-inner shadow-black/55">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleChatSend();
                    }
                  }}
                  placeholder="Type message for chat..."
                  className="h-11 w-full border-0 bg-transparent px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleChatSend()}
                disabled={isProcessing}
                className="glass-panel h-11 rounded-xl px-4 text-sm text-zinc-100 transition hover:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </section>
        ) : (
          <>
            <AvatarViewport isAssistantSpeaking={isAssistantSpeaking} />
            <SubtitleSystem
              sourceText={currentSubtitles.eng}
              translatedText={currentSubtitles.ru}
              isUpdating={isUpdatingSubs}
            />

            <section className="glass-panel rounded-2xl p-3">
              <h2 className="text-xs uppercase tracking-wide text-zinc-400">
                Vision context available in Live Practice
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {visionAssets.length ? (
                  visionAssets.map((asset) => (
                    <span
                      key={asset.id}
                      className="rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-xs text-zinc-200"
                    >
                      {asset.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">No vision files uploaded yet.</p>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Learned words: {profile.learnedWords.slice(0, 4).join(", ") || "No learned words yet"}
              </p>
            </section>

            <InteractionBar
              isListening={isListening}
              inputValue={liveInput}
              onInputChange={setLiveInput}
              onSend={() => void handleLiveSend()}
              onToggleListening={() => void toggleListening()}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
