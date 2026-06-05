import React, { useState, useEffect, useRef, useMemo } from "react";
import spritesheet from "../assets/spritesheet.png";

const FRAME_SIZE = 16;
const SCALE = 4;
const SPRITE_SIZE = FRAME_SIZE * SCALE;

// Rows (Direction): 0: Down, 1: Up, 2: Right, 3: Left
// Columns (Motion): 0: Stand, 1: Walk1, 2: Walk2
// Index Mapping:
// 0-2: Front, 3-5: Back, 6-8: Right, 9-11: Left
// 12: Desk, 13: Desk with Dev, 14: Sleep1, 15: Sleep2, 16: Sleep3, 17: Naked

function Sprite({ index, className = "", style = {} }) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return (
    <div
      className={`pixelated ${className}`}
      style={{
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        backgroundImage: `url(${spritesheet})`,
        backgroundPosition: `-${col * FRAME_SIZE}px -${row * FRAME_SIZE}px`,
        transform: `scale(${SCALE})`,
        transformOrigin: "top left",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}

function DeveloperDesk() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepFrame, setSleepFrame] = useState(0);
  const deskRef = useRef(null);

  useEffect(() => {
    const currentDesk = deskRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (currentDesk) {
      observer.observe(currentDesk);
    }

    return () => {
      if (currentDesk) {
        observer.unobserve(currentDesk);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const tick = () => {
      if (isSleeping) {
        if (Math.random() < 0.15) {
          setIsSleeping(false);
          setSleepFrame(0);
        } else {
          setSleepFrame((f) => (f + 1) % 3);
        }
      } else {
        if (Math.random() < 0.05) {
          setIsSleeping(true);
        }
      }
    };

    const interval = setInterval(tick, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [isVisible, isSleeping]);

  // 作業中: index 13 (机1) または稀に 17 (裸), 睡眠中: index 14, 15, 16 (寝1, 2, 3)
  const [isNaked] = useState(Math.random() < 0.02);
  const charIndex = isSleeping ? (14 + sleepFrame) : (isNaked ? 17 : 13);

  return (
    <div
      ref={deskRef}
      className="relative m-2"
      style={{ width: SPRITE_SIZE, height: SPRITE_SIZE }}
    >
      {isVisible && (
        <>
          {/* Desk background (index 12) */}
          <Sprite index={12} className="absolute inset-0" />
          {/* Character sitting/sleeping */}
          <Sprite index={charIndex} className="absolute inset-0" />
          
          {isSleeping && (
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-blue-500 font-bold text-xl select-none pointer-events-none animate-sway-z"
              style={{ zIndex: 20 }}
            >
              Z
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WalkingDeveloper({ containerRect }) {
  const [state, setState] = useState({
    x: Math.random() * (containerRect.width - SPRITE_SIZE),
    y: Math.random() * (containerRect.height - SPRITE_SIZE),
    direction: 0,
    animStep: 0,
    isWalking: false,
  });

  const velocityRef = useRef({ x: 0, y: 0 });
  const frameCounterRef = useRef(0);
  const stateTimerRef = useRef(Math.random() * 2000);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let requestRef;

    const move = (time) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setState((prev) => {
        let { x, y, direction, animStep, isWalking } = prev;

        const maxX = containerRect.width - SPRITE_SIZE;
        const maxY = containerRect.height - SPRITE_SIZE;

        x += velocityRef.current.x * (deltaTime / 10);
        y += velocityRef.current.y * (deltaTime / 10);

        // Boundary checks
        if (x < 0) { x = 0; velocityRef.current.x *= -1; }
        if (x > maxX) { x = maxX; velocityRef.current.x *= -1; }
        if (y < 0) { y = 0; velocityRef.current.y *= -1; }
        if (y > maxY) { y = maxY; velocityRef.current.y *= -1; }

        const vx = velocityRef.current.x;
        const vy = velocityRef.current.y;
        
        if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
          isWalking = true;
          if (Math.abs(vx) > Math.abs(vy)) {
            direction = vx > 0 ? 2 : 3;
          } else {
            direction = vy > 0 ? 0 : 1;
          }
        } else {
          isWalking = false;
        }

        if (isWalking) {
          frameCounterRef.current += deltaTime;
          if (frameCounterRef.current > 150) {
            animStep = (animStep + 1) % 4; // 0, 1, 2, 3 (Stand, Walk1, Stand, Walk2)
            frameCounterRef.current = 0;
          }
        } else {
          animStep = 0;
        }

        return { x, y, direction, animStep, isWalking };
      });

      stateTimerRef.current -= deltaTime;
      if (stateTimerRef.current <= 0) {
        // AI Update
        const isIdle = velocityRef.current.x === 0 && velocityRef.current.y === 0;
        if (isIdle) {
          const speed = 0.5 + Math.random() * 0.5;
          const rand = Math.random();
          if (rand < 0.25) velocityRef.current = { x: speed, y: 0 };
          else if (rand < 0.5) velocityRef.current = { x: -speed, y: 0 };
          else if (rand < 0.75) velocityRef.current = { x: 0, y: speed };
          else velocityRef.current = { x: 0, y: -speed };
          stateTimerRef.current = 2000 + Math.random() * 3000;
        } else {
          velocityRef.current = { x: 0, y: 0 };
          stateTimerRef.current = 1000 + Math.random() * 2000;
        }
      }

      requestRef = requestAnimationFrame(move);
    };

    requestRef = requestAnimationFrame(move);
    return () => cancelAnimationFrame(requestRef);
  }, [containerRect]);

  // Map animStep 0,1,2,3 to col 0,1,0,2
  const col = [0, 1, 0, 2][state.animStep];
  const spriteIndex = state.direction * 3 + col;

  return (
    <div 
      className="absolute z-20 pointer-events-none"
      style={{
        left: state.x,
        top: state.y,
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
      }}
    >
      <Sprite index={spriteIndex} />
    </div>
  );
}

export default function DeveloperTab({ developerCount = 0 }) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.scrollWidth,
          height: containerRef.current.scrollHeight,
        });
      }
    };
    // Initial size and also after some delay to let desks render
    updateSize();
    const timer = setTimeout(updateSize, 500);
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      clearTimeout(timer);
    };
  }, [developerCount]);

  const displayCount = Math.min(Math.floor(developerCount), 100);
  const devs = useMemo(() => Array.from({ length: displayCount }, (_, i) => i), [displayCount]);

  // Number of walking developers based on total count
  const walkingCount = Math.min(Math.floor(developerCount / 10), 5);
  const walkingDevs = useMemo(() => Array.from({ length: walkingCount }, (_, i) => i), [walkingCount]);

  return (
    <div className="w-full h-96 bg-gray-50 rounded-xl relative border-2 border-gray-300 shadow-inner flex flex-col overflow-hidden">
      {/* Visual background guide */}
      <div className="absolute inset-0 flex items-center justify-center text-gray-200 font-black text-4xl uppercase tracking-widest pointer-events-none select-none opacity-10">
        Developer Room
      </div>

      <div className="p-2 border-b border-gray-200 bg-white/50 flex justify-between items-center z-10">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Capacity: {displayCount} / {Math.floor(developerCount)}
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-wrap justify-center content-start gap-2 scroll-smooth relative"
      >
        {devs.map((id) => (
          <DeveloperDesk key={id} id={id} />
        ))}
        
        {containerSize.width > 0 && walkingDevs.map((id) => (
          <WalkingDeveloper key={`walk-${id}`} containerRect={containerSize} />
        ))}

        {displayCount === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-bold italic z-10">
            No developers yet...
          </div>
        )}
      </div>
    </div>
  );
}
