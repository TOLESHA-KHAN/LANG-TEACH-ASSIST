type SubtitleSystemProps = {
  sourceText: string;
  translatedText: string;
  isUpdating?: boolean;
};

export default function SubtitleSystem({
  sourceText,
  translatedText,
  isUpdating = false,
}: SubtitleSystemProps) {
  return (
    <section className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur">
      <div
        className={`space-y-2 text-center transition-opacity duration-300 md:text-left ${
          isUpdating ? "opacity-40" : "opacity-100"
        }`}
      >
        <p className="text-base leading-relaxed text-zinc-100">{sourceText}</p>
        <p className="text-sm leading-relaxed text-zinc-400">{translatedText}</p>
      </div>
    </section>
  );
}
