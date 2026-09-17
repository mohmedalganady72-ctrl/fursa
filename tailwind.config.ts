import type { Config } from "tailwindcss";

// هذا الملف لا يحتوي أي قيمة لون/مسافة "مخترَعة" هنا —
// كل قيمة تُقرأ من متغيرات CSS المعرَّفة في app/globals.css
// (المصدر الوحيد للحقيقة، موثّق بالكامل في docs/design-system.md).
// أي تعديل مستقبلي على الهوية البصرية يحدث في globals.css فقط وينعكس هنا تلقائيًا.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          DEFAULT: "var(--color-primary-600)",
        },
        accent: {
          100: "var(--color-accent-100)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          DEFAULT: "var(--color-accent-500)",
        },
        success: { 50: "var(--color-success-50)", 500: "var(--color-success-500)" },
        warning: { 50: "var(--color-warning-50)", 500: "var(--color-warning-500)" },
        danger: { 50: "var(--color-danger-50)", 500: "var(--color-danger-500)" },
        info: { 50: "var(--color-info-50)", 500: "var(--color-info-500)" },
        neutral: {
          0: "var(--color-neutral-0)",
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },
        // أسطح دلالية تتغيّر تلقائيًا بين الوضع الفاتح والداكن (راجع globals.css)
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        "brand-deep": "var(--brand-deep)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        "on-primary": "var(--text-on-primary)",
      },
      fontFamily: {
        // الخط العربي هو الافتراضي (font-sans) لأن المشروع عربي أولًا
        sans: ["var(--font-ibm-plex-arabic)", "system-ui", "sans-serif"],
        latin: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-ibm-plex-arabic)", "sans-serif"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.3", fontWeight: "700" }],
        h1: ["2.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.375rem", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["1.125rem", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.6", fontWeight: "400" }],
        body: ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        overline: [
          "0.6875rem",
          { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.05em" },
        ],
      },
      spacing: {
        // سلّم مسافات إضافي فوق سلّم Tailwind الافتراضي (وليس بديلًا عنه) —
        // يُستخدم عند الحاجة لقيم موثّقة صراحة في نظام التصميم
        18: "4.5rem",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      keyframes: {
        // حركات بسيطة موظَّفة فقط (لا Bounce ولا Elastic — راجع design-system.md § الحركة)
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in-from-start": {
          from: { transform: "translateX(-8px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-base) ease-in-out",
        "slide-in-from-start": "slide-in-from-start var(--duration-base) ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
