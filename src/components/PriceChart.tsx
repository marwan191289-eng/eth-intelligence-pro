import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/engine";
import { ema } from "@/lib/engine";

function cssColor(name: string) {
  const el = document.createElement("div");
  el.style.color = `var(${name})`;
  document.body.appendChild(el);
  const c = getComputedStyle(el).color;
  el.remove();
  return c;
}

export default function PriceChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    import("lightweight-charts").then(({ createChart }) => {
      if (disposed || !ref.current) return;
      const fg = cssColor("--muted-foreground"), grid = cssColor("--border");
      const up = cssColor("--bull"), down = cssColor("--bear"), acc = cssColor("--primary");
      const chart = createChart(ref.current, {
        autoSize: true,
        layout: { background: { color: "transparent" }, textColor: fg, fontFamily: "JetBrains Mono" },
        grid: { vertLines: { color: grid }, horzLines: { color: grid } },
        timeScale: { timeVisible: true, borderColor: grid },
        rightPriceScale: { borderColor: grid },
      });
      const series = chart.addCandlestickSeries({ upColor: up, downColor: down, wickUpColor: up, wickDownColor: down, borderVisible: false });
      const e9 = chart.addLineSeries({ color: acc, lineWidth: 1, priceLineVisible: false });
      const e21 = chart.addLineSeries({ color: fg, lineWidth: 1, priceLineVisible: false });
      api.current = { chart, series, e9, e21 };
    });
    return () => { disposed = true; api.current?.chart.remove(); api.current = null; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!api.current || !candles.length) return;
      clearInterval(id);
    }, 50);
    if (!api.current || !candles.length) return () => clearInterval(id);
    const closes = candles.map((c) => c.close);
    const a = ema(closes, 9), b = ema(closes, 21);
    api.current.series.setData(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
    api.current.e9.setData(candles.map((c, i) => ({ time: c.time, value: a[i] })));
    api.current.e21.setData(candles.map((c, i) => ({ time: c.time, value: b[i] })));
    return () => clearInterval(id);
  }, [candles]);

  return <div ref={ref} className="h-[440px] w-full" />;
}
