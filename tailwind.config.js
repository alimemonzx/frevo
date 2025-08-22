/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: true,
  },
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-gradient-to-br",
    "from-blue-50",
    "via-white",
    "to-indigo-50",
    "bg-gradient-to-r",
    "from-blue-500",
    "to-indigo-600",
    "from-red-500",
    "to-red-600",
    "hover:from-red-600",
    "hover:to-red-700",
    "from-green-500",
    "to-green-600",
    "hover:from-green-600",
    "hover:to-green-700",
    "from-amber-50",
    "to-orange-50",
    // Frevo button classes
    "from-purple-500",
    "to-blue-600",
    "hover:-translate-y-0.5",
    "animate-pulse",
    "group",
    "group-hover:translate-x-full",
    "-translate-x-full",
    "via-white/20",
    "via-white/30",
    "-skew-x-12",
  ],
};
