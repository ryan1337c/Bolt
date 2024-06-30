import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(transparent 270deg, white, transparent)",
        "green-background": "url('../public/mainBackground.avif')",
      },
      fontFamily: {
        'custom-font': ['Open Sans', 'sans-serif'],
      },
      colors: {
        'textBox': "#e2e8f0",
        'downloadBox': '#D7D7D7',
        'downloadBoxOnHover': '#c1c1c1',
        'landingPage': '#1e293b',
        'hoverLandingPage': '#020617',
      },
      height: {
        'chatbox': "45rem",
        'chatHistoryBox': '55rem',
      },
      maxWidth: {
        '256': '256px'
      },
  
    },
  },
  plugins: [],
};
export default config;
