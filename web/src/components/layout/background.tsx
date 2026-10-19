import { Particles } from "@/components/magicui/particles";

/** A quiet starfield with a faint moonlit glow; hidden for people who prefer reduced motion. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-64 right-[-10%] size-[42rem] rounded-full bg-royal/25 blur-[140px]" />
      <Particles
        className="absolute inset-0 motion-reduce:hidden"
        quantity={110}
        staticity={70}
        ease={70}
        size={0.35}
        color="#c9d3ff"
      />
    </div>
  );
}
