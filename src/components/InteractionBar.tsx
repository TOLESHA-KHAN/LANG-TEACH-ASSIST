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
    <section className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle microphone"
          onClick={onToggleListening}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border text-zinc-200 transition hover:text-white ${
            isListening
              ? "animate-pulse border-cyan-400 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.55)]"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
          }`}
        >
          <Mic className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Type your message..."
          className="h-11 flex-1 rounded-xl border border-zinc-700 bg-black px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 transition focus:border-zinc-500"
        />

        <button
          type="button"
          aria-label="Send message"
          onClick={onSend}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-zinc-500 hover:text-white"
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
