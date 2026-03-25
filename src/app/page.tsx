"use client";

import { ChangeEvent, MutableRefObject, useEffect, useRef, useState } from "react";
import AvatarViewport from "@/components/AvatarViewport";
import InteractionBar from "@/components/InteractionBar";
import MainLayout from "@/components/MainLayout";
import SubtitleSystem from "@/components/SubtitleSystem";

type SubtitlePair = {
  eng: string;
  ru: string;
};

type TabMode = "chat" | "live";

type ChatRecord = {
  id: string;
  mode: TabMode;
  kind: "text" | "vision";
  role: "user";
  content: string;
  createdAt: string;
  visionFiles?: string[];
};

type VisionAsset = {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
};

const DEFAULT_SUBTITLES: SubtitlePair = {
  eng: "Hello! Let's practice pronunciation together.",
  ru: "Привет! Давай вместе потренируем произношение.",
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabMode>("chat");
  const [isListening, setIsListening] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [liveInput, setLiveInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatRecord[]>([]);
  const [visionAssets, setVisionAssets] = useState<VisionAsset[]>([]);
  const [currentSubtitles, setCurrentSubtitles] =
    useState<SubtitlePair>(DEFAULT_SUBTITLES);
  const [isUpdatingSubs, setIsUpdatingSubs] = useState(false);

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    setChatHistory((prevState) => [...prevState, entry]);
  };

  const handleChatSend = () => {
    const message = chatInput.trim();
    if (!message) {
      return;
    }

    appendHistory({
      mode: "chat",
      kind: "text",
      role: "user",
      content: message,
    });
    setChatInput("");
  };

  const handleLiveSend = () => {
    const message = liveInput.trim();
    if (!message) {
      return;
    }

    clearTimeoutRef(resetTimeoutRef);

    appendHistory({
      mode: "live",
      kind: "text",
      role: "user",
      content: message,
    });
    updateSubs({ eng: message, ru: `Временный перевод: ${message}` });
    setLiveInput("");

    resetTimeoutRef.current = setTimeout(() => {
      updateSubs(DEFAULT_SUBTITLES);
    }, 2400);
  };

  const handleVisionUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const uploadedAssets = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type || "unknown",
      createdAt: new Date().toISOString(),
    }));

    setVisionAssets((prevState) => [...prevState, ...uploadedAssets]);
    appendHistory({
      mode: "chat",
      kind: "vision",
      role: "user",
      content: `Vision upload: ${uploadedAssets.map((asset) => asset.name).join(", ")}`,
      visionFiles: uploadedAssets.map((asset) => asset.name),
    });

    event.target.value = "";
  };

  useEffect(() => {
    return () => {
      clearTimeoutRef(transitionTimeoutRef);
      clearTimeoutRef(resetTimeoutRef);
    };
  }, []);

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-4">
        <div className="flex w-fit rounded-xl border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === "chat"
                ? "bg-zinc-100 text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === "live"
                ? "bg-zinc-100 text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Live Practice
          </button>
        </div>

        {activeTab === "chat" ? (
          <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-zinc-200">Shared History</h2>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-black/50 p-3">
                {chatHistory.length ? (
                  chatHistory.map((record) => (
                    <article key={record.id} className="rounded-lg border border-zinc-800 p-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {record.mode === "chat" ? "Chat" : "Live Practice"} • {record.kind}
                      </p>
                      <p className="text-sm text-zinc-100">{record.content}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No messages yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/40 p-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500">
                Vision
                <input type="file" multiple className="hidden" onChange={handleVisionUpload} />
              </label>
              <p className="mt-2 text-xs text-zinc-500">
                Uploaded files become shared context for both Chat and Live Practice.
              </p>
            </div>

            <div className="mt-auto flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleChatSend();
                  }
                }}
                placeholder="Type message for chat..."
                className="h-11 flex-1 rounded-xl border border-zinc-700 bg-black px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={handleChatSend}
                className="h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100 transition hover:border-zinc-500"
              >
                Send
              </button>
            </div>
          </section>
        ) : (
          <>
            <AvatarViewport />
            <SubtitleSystem
              sourceText={currentSubtitles.eng}
              translatedText={currentSubtitles.ru}
              isUpdating={isUpdatingSubs}
            />

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
              <h2 className="text-xs uppercase tracking-wide text-zinc-500">
                Vision context available in Live Practice
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {visionAssets.length ? (
                  visionAssets.map((asset) => (
                    <span
                      key={asset.id}
                      className="rounded-lg border border-zinc-700 bg-black/50 px-2 py-1 text-xs text-zinc-300"
                    >
                      {asset.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No vision files uploaded yet.</p>
                )}
              </div>
            </section>

            <InteractionBar
              isListening={isListening}
              inputValue={liveInput}
              onInputChange={setLiveInput}
              onSend={handleLiveSend}
              onToggleListening={() => setIsListening((prevState) => !prevState)}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
