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
    <section className="glass-panel w-full rounded-2xl p-4">
      <div
        className={`space-y-2 text-center transition-opacity duration-500 md:text-left ${
          isUpdating ? "opacity-45" : "opacity-100"
        }`}
      >
        <p className="text-base leading-relaxed text-white">{sourceText}</p>
        <p className="text-sm leading-relaxed text-zinc-300">{translatedText}</p>
      </div>
    </section>
  );
}
