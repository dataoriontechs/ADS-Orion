
'use client';

export function BackgroundGlow() {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
      <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px]" />
    </div>
  );
}
