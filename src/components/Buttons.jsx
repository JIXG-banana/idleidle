import React, { memo, forwardRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Decimal from "break_infinity.js";

export const TabButton = memo(
  forwardRef(({ active, onClick, children }, ref) => {
    const baseClass =
      "text-white font-bold py-2 px-4 rounded transition-colors";
    const activeClass = active
      ? "bg-green-800"
      : "bg-gray-500 hover:bg-blue-600";
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`${baseClass} ${activeClass}`}
      >
        {children}
      </button>
    );
  }),
);

export const ActionButton = memo(
  ({
    onClick,
    disabled,
    children,
    colorClass = "bg-blue-500 hover:bg-blue-600",
    shadowClass = "shadow-[0_4px_0_0_theme(colors.blue.700)]",
    flashing = false,
    currentValue,
    targetValue,
    progressColorClass = "bg-white/20",
  }) => {
    const activeStyle = !disabled
      ? `active:translate-y-[2px] active:shadow-none ${shadowClass}`
      : "opacity-50 cursor-not-allowed translate-y-[2px]";

    // Calculate progress percentage
    let progress = 0;
    if (currentValue !== undefined && targetValue !== undefined) {
      const current = new Decimal(currentValue);
      const target = new Decimal(targetValue);
      if (target.gt(0)) {
        progress = Math.min(
          Math.max(current.div(target).toNumber() * 100, 0),
          100,
        );
      } else {
        progress = 100;
      }
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
        ${colorClass} text-white font-bold py-2 px-4 rounded-lg
        transition-all duration-75 relative overflow-hidden
        ${activeStyle}
        ${flashing ? "animate-flash" : ""}
      `}
        style={{
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        {/* Progress Bar Overlay */}
        {currentValue !== undefined && targetValue !== undefined && progress < 100 && (
          <motion.div
            className={`absolute bottom-0 left-0 h-full ${progressColorClass} pointer-events-none`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          />
        )}
        
        <span className="relative z-10">{children}</span>
      </button>
    );
  },
);
