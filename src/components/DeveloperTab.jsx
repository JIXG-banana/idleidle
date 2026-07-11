import React, { useState, useEffect, useRef, useMemo } from "react";

const SKILLS = [
  {
    id: "basics",
    nameJa: "クリーンコード",
    nameEn: "Clean Code",
    descJa: "読みやすく整理されたコード。すべてのプログラミングの基礎。（通常開発者の生産性 +50%）",
    descEn: "Write well-structured code. The absolute foundation of all programming skills. (+50% Normal Dev Production)",
    icon: "💻",
    cost: 1,
    x: 50,
    y: 12,
    requires: [],
  },
  {
    id: "frontend",
    nameJa: "フロントエンド開発",
    nameEn: "Frontend Dev",
    descJa: "美しく反応の良いUI。プレイヤーの目に見えるインターフェースを磨きます。（通常開発者の生産性 +50%）",
    descEn: "Build beautiful and responsive interfaces. Polishes layouts and visual feedback. (+50% Normal Dev Production)",
    icon: "🎨",
    cost: 1,
    x: 30,
    y: 32,
    requires: ["basics"],
  },
  {
    id: "backend",
    nameJa: "バックエンド開発",
    nameEn: "Backend Dev",
    descJa: "サーバーの設計とロジック。ゲームデータやAPIのリクエスト処理を高速化します。（ゲームごとの秒間ゴールド収入 +50%）",
    descEn: "Manage server endpoints and application logic. Optimizes API response times. (+50% Gold per Game/s)",
    icon: "🗄️",
    cost: 1,
    x: 70,
    y: 32,
    requires: ["basics"],
  },
  {
    id: "css_magic",
    nameJa: "CSSの魔術",
    nameEn: "CSS Wizardry",
    descJa: "FlexboxやGridを自在に操り、どんな要素も検索することなく一瞬で中央揃えにします。（企業による開発者の雇用速度 +50%）",
    descEn: "Understand layout styling perfectly. Allows centering a div instantly without searching. (+50% Dev generation rate from Companies)",
    icon: "🪄",
    cost: 2,
    x: 18,
    y: 54,
    requires: ["frontend"],
  },
  {
    id: "react_ninja",
    nameJa: "Reactの真髄",
    nameEn: "React Mastery",
    descJa: "レンダリングの最適化とカスタムフックの構築。無駄な再レンダリングを完全に防ぎます。（通常開発者の生産性 +100%）",
    descEn: "Master custom hooks and state updates. Prevents redundant browser paint cycles. (+100% Normal Dev Production)",
    icon: "⚛️",
    cost: 2,
    x: 42,
    y: 54,
    requires: ["frontend"],
  },
  {
    id: "sql_opt",
    nameJa: "DBチューニング",
    nameEn: "Database Tuning",
    descJa: "インデックスの追加と効率的なクエリ作成。（課金・寄付の獲得ゴールド +100%）",
    descEn: "Optimize slow DB indexes and schema design. Executes heavy queries in milliseconds. (+100% Gold gained from Billing/Purchases)",
    icon: "⚡",
    cost: 2,
    x: 58,
    y: 54,
    requires: ["backend"],
  },
  {
    id: "cloud_scale",
    nameJa: "クラウド設計",
    nameEn: "Cloud Architect",
    descJa: "サーバーレスアーキテクチャの導入。アクセス急増に耐えうる拡張設計を構築します。（財閥・政府による生産速度 +100%）",
    descEn: "Deploy flexible serverless infrastructure. Builds auto-scaling server groups. (+100% Production rate from Conglomerates and Governments)",
    icon: "☁️",
    cost: 2,
    x: 82,
    y: 54,
    requires: ["backend"],
  },
  {
    id: "fullstack",
    nameJa: "フルスタック統合",
    nameEn: "Fullstack Unity",
    descJa: "フロントとバックエンドのシームレスな通信。（通常開発者の生産性 +100% ＆ 秒間ゴールド収入 +100%）",
    descEn: "Bridge frontend and backend seamlessly. Eliminates latency between client and DB. (+100% Normal Dev Production & +100% Gold per Game/s)",
    icon: "🚀",
    cost: 3,
    x: 50,
    y: 74,
    requires: ["react_ninja", "sql_opt"],
  },
  {
    id: "ai_copilot",
    nameJa: "AIアシスタント",
    nameEn: "AI Copilot",
    descJa: "開発環境にAIコパイロットを導入。関数やテストコードを一瞬で自動生成します。（オートメーション速度 +100%）",
    descEn: "Integrate powerful local AI models. Auto-generates functions and boilerplate code. (+100% Automation purchase speed)",
    icon: "🤖",
    cost: 4,
    x: 50,
    y: 90,
    requires: ["fullstack"],
  },
];

export default function DeveloperTab({ normalDeveloperCount = 0, t, unlockedSkills = [], setGameState }) {
  const treeRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const lang = t && t("tabs.developer") ? (t("tabs.developer").includes("開発者") ? "ja" : "en") : "ja";

  useEffect(() => {
    if (treeRef.current) {
      const handleResize = () => {
        setDimensions({
          width: treeRef.current.clientWidth,
          height: treeRef.current.clientHeight,
        });
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      const timer = setTimeout(handleResize, 100);
      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(timer);
      };
    }
  }, []);

  const isSkillsUnlocked = normalDeveloperCount >= 1000;

  const maxPoints = Math.max(0, Math.floor(normalDeveloperCount / 100) - 9);
  const spentPoints = useMemo(() => {
    return SKILLS.filter(s => unlockedSkills.includes(s.id)).reduce((sum, s) => sum + s.cost, 0);
  }, [unlockedSkills]);
  const availablePoints = Math.max(0, maxPoints - spentPoints);

  const unlockSkill = (skill) => {
    if (unlockedSkills.includes(skill.id)) return;
    const canUnlock = skill.requires.every(reqId => unlockedSkills.includes(reqId)) && availablePoints >= skill.cost;
    if (canUnlock) {
      setGameState(prev => ({
        ...prev,
        unlockedSkills: [...(prev.unlockedSkills || []), skill.id]
      }));
    }
  };

  const resetSkills = () => {
    setGameState(prev => ({
      ...prev,
      unlockedSkills: []
    }));
  };

  const connections = useMemo(() => {
    const list = [];
    SKILLS.forEach(skill => {
      skill.requires.forEach(reqId => {
        const parent = SKILLS.find(s => s.id === reqId);
        if (parent) {
          list.push({
            from: parent,
            to: skill,
            active: unlockedSkills.includes(parent.id) && unlockedSkills.includes(skill.id),
            halfActive: unlockedSkills.includes(parent.id),
          });
        }
      });
    });
    return list;
  }, [unlockedSkills]);

  return (
    <div className="w-full h-[550px] bg-slate-950 rounded-2xl relative border-2 border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-4 py-3 z-30">
        <h2 className="text-sm font-bold text-indigo-400">
          {lang === "ja" ? "開発者スキルツリー ⚡" : "Developer Skill Tree ⚡"}
        </h2>
        {isSkillsUnlocked && (
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-indigo-300">
              {lang === "ja" ? `開発者ポイント (DP): ${availablePoints} / ${maxPoints}` : `Developer Points (DP): ${availablePoints} / ${maxPoints}`}
            </span>
            <button
              onClick={resetSkills}
              className="px-2 py-0.5 border border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-400 rounded text-[10px] font-bold transition-colors"
            >
              {lang === "ja" ? "リセット" : "Reset"}
            </button>
          </div>
        )}
      </div>

      {/* SKILL TREE CONTAINER */}
      <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
        {!isSkillsUnlocked ? (
          /* LOCKED CONTAINER */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-25 relative bg-slate-900/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center text-4xl shadow-2xl relative mb-6 animate-pulse">
              🔒
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">
              {lang === "ja" ? "開発者スキルツリー未解放" : "Developer Skill Tree Locked"}
            </h2>
            <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
              {lang === "ja"
                ? "開発者の可能性は無限大です。チームをさらに成長させて、高度な技術ツリーを解放しましょう！"
                : "The potential of developers is infinite. Grow your team further to unlock the advanced tech tree!"}
            </p>
            
            {/* Unlock criteria progress bar */}
            <div className="w-64 flex flex-col gap-1 text-left">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>PROGRESS</span>
                <span>{normalDeveloperCount} / 1,000</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  style={{ width: `${Math.min((normalDeveloperCount / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED MOCK SKILL TREE */
          <div ref={treeRef} className="flex-1 w-full relative overflow-hidden bg-slate-900/40">
            <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
            
            {/* Connection lines using SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {dimensions.width > 0 && connections.map((conn, idx) => {
                const x1 = (conn.from.x / 100) * dimensions.width;
                const y1 = (conn.from.y / 100) * dimensions.height;
                const x2 = (conn.to.x / 100) * dimensions.width;
                const y2 = (conn.to.y / 100) * dimensions.height;
                
                const pathData = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;
                
                let strokeColor = "#1e293b"; // Dim slate for locked
                let glowColor = "transparent";
                let strokeWidth = 2;
                
                if (conn.active) {
                  strokeColor = "#fbbf24"; // Bright gold for active
                  glowColor = "rgba(251, 191, 36, 0.3)";
                  strokeWidth = 3;
                } else if (conn.halfActive) {
                  strokeColor = "#6366f1"; // Indigo for partial paths
                  glowColor = "rgba(99, 102, 241, 0.15)";
                  strokeWidth = 2;
                }
                
                return (
                  <g key={idx}>
                    {glowColor !== "transparent" && (
                      <path
                        d={pathData}
                        stroke={glowColor}
                        strokeWidth={strokeWidth + 4}
                        fill="none"
                        className="transition-all duration-300"
                      />
                    )}
                    <path
                      d={pathData}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                      className="transition-all duration-300"
                      strokeDasharray={conn.active ? "none" : conn.halfActive ? "3,3" : "none"}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render nodes */}
            {SKILLS.map((skill) => {
              const isUnlocked = unlockedSkills.includes(skill.id);
              const isParentUnlocked = skill.requires.every(reqId => unlockedSkills.includes(reqId));
              const canAfford = availablePoints >= skill.cost;
              const isAvailable = isParentUnlocked && !isUnlocked;
              
              let borderStyle = "border-slate-800 bg-slate-950/90 text-slate-600";
              let glowStyle = "";
              
              if (isUnlocked) {
                borderStyle = "border-yellow-400 bg-yellow-950/30 text-yellow-300 ring-2 ring-yellow-400/20";
                glowStyle = "shadow-[0_0_15px_rgba(250,204,21,0.25)]";
              } else if (isAvailable) {
                if (canAfford) {
                  borderStyle = "border-indigo-400 bg-slate-900/90 text-white cursor-pointer hover:border-indigo-350 hover:bg-slate-800/90";
                  glowStyle = "shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse";
                } else {
                  borderStyle = "border-indigo-900 bg-slate-950/95 text-indigo-500 cursor-not-allowed";
                }
              }
              
              return (
                <div
                  key={skill.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl transition-all duration-200 select-none z-10 ${borderStyle} ${glowStyle}`}
                  style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                  onClick={() => isAvailable && canAfford && unlockSkill(skill)}
                >
                  {skill.icon}
                  
                  {/* Node level badge / checkmark */}
                  {isUnlocked && (
                    <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-yellow-950 rounded-full w-4 h-4 text-[9px] font-bold flex items-center justify-center">
                      ✓
                    </span>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700 w-56 text-left z-35 pointer-events-none transition-all duration-200">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-1.5 mb-1.5">
                      <span className="font-bold text-indigo-400">{lang === "ja" ? skill.nameJa : skill.nameEn}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isUnlocked ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-800 text-slate-400"}`}>
                        {isUnlocked ? (lang === "ja" ? "解放済" : "Unlocked") : `${skill.cost} DP`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">{lang === "ja" ? skill.descJa : skill.descEn}</p>
                    {!isUnlocked && (
                      <div className="mt-2 text-[10px] font-bold border-t border-slate-850 pt-1.5">
                        {isAvailable ? (
                          canAfford ? (
                            <span className="text-green-400 animate-pulse">👉 {lang === "ja" ? "クリックして解放" : "Click to Unlock"}</span>
                          ) : (
                            <span className="text-red-400">❌ {lang === "ja" ? "ポイント不足" : "Not enough DP"}</span>
                          )
                        ) : (
                          <span className="text-slate-500">🔒 {lang === "ja" ? "前提スキルが必要" : "Locked (Prerequisites required)"}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Skill Tree Bottom Info Message */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-center z-20 pointer-events-none shadow-md max-w-sm">
              <span className="text-[9px] font-mono text-indigo-400">
                {lang === "ja"
                  ? "⚡ スキルツリーが有効になりました！各スキルは生産効率に直接影響します。"
                  : "⚡ Skill tree is now active! Each skill directly improves production efficiency."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
