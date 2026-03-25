import { Sparkles } from "lucide-react";

type AvatarViewportProps = {
  isAssistantSpeaking: boolean;
};

export default function AvatarViewport({ isAssistantSpeaking }: AvatarViewportProps) {
  return (
    <section className="glass-panel relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_60%)]" />

      <div className="relative flex h-64 w-64 items-center justify-center">
        <div
          className={`portal-ring absolute inset-0 rounded-full border border-cyan-400/60 shadow-[0_0_45px_rgba(34,211,238,0.35)] ${
            isAssistantSpeaking ? "animate-pulse drop-shadow-[0_0_20px_rgba(34,211,238,1)]" : ""
          }`}
        />
        <div className="portal-ring absolute inset-5 rounded-full border border-indigo-300/40 [animation-direction:reverse]" />
        <div
          className={`portal-pulse absolute inset-10 rounded-full bg-cyan-300/10 blur-md ${
            isAssistantSpeaking ? "scale-110 bg-cyan-300/25" : ""
          }`}
        />

        <div className="relative z-10 flex flex-col items-center gap-2 text-cyan-100">
          <Sparkles className="h-6 w-6" />
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85">AI Portal</p>
        </div>
      </div>
    </section>
  );
}
