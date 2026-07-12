import React, { useState, useMemo } from "react";

export default function GraphTab({ history, t, format }) {
  // グラフに表示可能なメトリクスの設定
  // ここに項目を追加するだけでプルダウンの選択肢が増えます
  const metrics = [
    {
      key: "games",
      label: t("ui.games", { count: "" }).replace(":", "").trim(),
    },
    {
      key: "money",
      label: t("ui.money", { count: "" }).replace(":", "").trim(),
    },
    { key: "developer", label: t("ui.developer") },
    { key: "company", label: t("ui.publisher") },
    { key: "conglomerate", label: t("ui.conglomerate") },
  ];

  const [selectedKey, setSelectedKey] = useState("games");

  // SVG描画用の計算
  const { points, maxVal, minVal } = useMemo(() => {
    if (history.length === 0) return { points: "", maxVal: 0, minVal: 0 };

    const values = history.map((h) => h[selectedKey]);
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;

    const width = 500;
    const height = 200;
    const padding = 20;

    const pts = history
      .map((h, i) => {
        const x =
          (i / Math.max(history.length - 1, 1)) * (width - padding * 2) +
          padding;
        const y =
          height -
          padding -
          ((h[selectedKey] - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

    return { points: pts, maxVal: max, minVal: min };
  }, [history, selectedKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="metric-select" className="font-bold">
          {t("ui.view_stats") || "Stats:"}
        </label>
        <select
          id="metric-select"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="p-2 border border-gray-400 rounded bg-white text-black font-bold flex-1"
        >
          {metrics.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border-2 border-gray-300 rounded-xl p-4 shadow-inner">
        {history.length < 2 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-400 font-bold">
            {t("ui.collecting_data") || "Collecting data... (Wait 1s)"}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 left-0 text-[10px] font-mono text-gray-500">
              {format(maxVal)}
            </div>
            <div className="absolute bottom-4 left-0 text-[10px] font-mono text-gray-500">
              {format(minVal)}
            </div>
            <svg
              viewBox="0 0 500 200"
              className="w-full h-auto stroke-blue-500 fill-none"
              style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))" }}
            >
              {/* Grid lines */}
              <line
                x1="20"
                y1="20"
                x2="20"
                y2="180"
                stroke="#eee"
                strokeWidth="1"
              />
              <line
                x1="20"
                y1="180"
                x2="480"
                y2="180"
                stroke="#eee"
                strokeWidth="1"
              />

              {/* Data line */}
              <polyline
                points={points}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center italic">
        {t("ui.graph_desc") || "Data recorded every second. Reset on reload."}
      </p>
    </div>
  );
}
