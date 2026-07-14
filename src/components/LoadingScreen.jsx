import React from "react";
import { motion } from "framer-motion";

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center p-6 text-white font-mono"
    >
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-10">
          <div className="flex justify-center">
            <img src="/favicon.ico" alt="Loading" className="w-24 h-24 animate-pulse" />
          </div>
          <div className="w-full h-1 bg-gray-900 overflow-hidden relative border border-gray-800">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="text-[9px] text-gray-600 text-center space-y-1 font-bold">
          <p>PRODUCTION ENGINE INITIALIZED</p>
        </div>
      </div>
    </motion.div>
  );
}