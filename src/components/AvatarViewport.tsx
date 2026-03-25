import { Video } from "lucide-react";

export default function AvatarViewport() {
  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(39,39,42,0.35),transparent_65%)]" />

      <div className="relative z-10 flex flex-col items-center gap-3 text-zinc-400">
        <div className="rounded-full border border-zinc-700 bg-zinc-900 p-4">
          <Video className="h-7 w-7" />
        </div>
        <p className="text-sm tracking-wide">Avatar video stream placeholder</p>
      </div>
    </section>
  );
}
