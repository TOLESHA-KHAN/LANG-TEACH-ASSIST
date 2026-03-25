import { KeyboardEvent } from "react";
import { Mic, SendHorizonal } from "lucide-react";

type InteractionBarProps = {
  isListening: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onToggleListening: () => void;
};

export default function InteractionBar({
  isListening,
  inputValue,
  onInputChange,
  onSend,
  onToggleListening,
}: InteractionBarProps) {
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSend();
    }
  };

  return (
    <section className="glass-panel w-full rounded-2xl p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle microphone"
          onClick={onToggleListening}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border text-zinc-200 transition hover:text-white ${
            isListening
              ? "animate-pulse border-cyan-300/80 bg-cyan-400/10 shadow-[0_0_22px_rgba(56,189,248,0.75)] drop-shadow-[0_0_14px_rgba(34,211,238,0.95)]"
              : "border-white/15 bg-black/35 hover:border-cyan-300/50"
          }`}
        >
          <Mic className="h-5 w-5" />
        </button>

        <div className="flex-1 rounded-xl border border-white/10 bg-black/35 px-1 shadow-inner shadow-black/55">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type your message..."
            className="h-11 w-full border-0 bg-transparent px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />
        </div>

        <button
          type="button"
          aria-label="Send message"
          onClick={onSend}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-black/35 text-zinc-200 transition hover:border-cyan-300/50 hover:text-white"
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
