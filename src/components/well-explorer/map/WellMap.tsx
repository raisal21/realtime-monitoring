interface WellMapProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function WellMap({ containerRef }: WellMapProps) {
  return (
    <div
      ref={containerRef}
      className="flex-1 h-full"
      style={{ background: "#0f1214" }}
    />
  );
}
