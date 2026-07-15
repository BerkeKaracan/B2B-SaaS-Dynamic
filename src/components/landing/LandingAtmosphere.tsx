'use client';

export default function LandingAtmosphere() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden
    >
      <div className="absolute -top-24 -left-16 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.28)_0%,transparent_68%)]" />
      <div className="absolute -bottom-28 -right-10 w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.22)_0%,transparent_68%)]" />
    </div>
  );
}
