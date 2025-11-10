import React from "react";

export default function ChartContainer({
  height = 220,
  children,
  style,
}: {
  height?: number | string;
  children: (dims: { width: number; height: number }) => React.ReactNode;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setDims({ w: Math.max(0, r.width), h: Math.max(0, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        minWidth: 0,
        minHeight: 0,
        ...style,
      }}
    >
      {dims.w > 0 && dims.h > 0 ? children({ width: dims.w, height: dims.h }) : null}
    </div>
  );
}
