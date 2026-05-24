import React, { memo, forwardRef } from "react";

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
  }) => {
    const activeStyle = !disabled
      ? `active:translate-y-[2px] active:shadow-none ${shadowClass}`
      : "opacity-50 cursor-not-allowed translate-y-[2px]";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
        ${colorClass} text-white font-bold py-2 px-4 rounded-lg
        transition-all duration-75 relative
        ${activeStyle}
        ${flashing ? "animate-flash" : ""}
      `}
        style={{
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        {children}
      </button>
    );
  },
);
