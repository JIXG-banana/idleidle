import React, { memo, useRef, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const InfoToast = memo(({ toast, onComplete }) => {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 backdrop-blur-md w-max max-w-[90vw] pointer-events-auto"
    >
      <span className="text-2xl">{toast.icon}</span>
      <span className="font-bold text-sm tracking-tight">{toast.title}</span>
    </motion.div>
  );
});

export const AchievementToast = memo(({ achievement, onComplete, targetPos }) => {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ y: 500, x: "-50%", rotate: -20, scale: 0.5, opacity: 1 }}
      animate={{
        y: [500, -20, 0],
        x: "-50%",
        rotate: [10, -10, 5, 0],
        scale: 1,
        opacity: 1,
      }}
      exit={{
        x: targetPos.x,
        y: targetPos.y,
        scale: 0,
        opacity: 0,
        transition: { duration: 0.7, ease: "backIn" },
      }}
      transition={{
        duration: 1.2,
        times: [0, 0.6, 0.8, 0.9, 1],
        ease: "easeOut",
      }}
      className="fixed top-1/2 left-1/2 z-[100] w-64 p-6 bg-yellow-400 border-4 border-white rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center"
    >
      <div className="text-6xl mb-2">{achievement.icon}</div>
      <div className="text-black font-black text-xl uppercase tracking-tighter">
        Achievement Unlocked!
      </div>
      <div className="text-yellow-900 font-bold text-lg leading-tight">
        {achievement.title}
      </div>
    </motion.div>
  );
});
