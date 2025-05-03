/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        'bg-primary': '#000000',    // Pure black for main background
        'bg-secondary': '#1C1C1E',  // Slightly lighter black for cards
        'bg-tertiary': '#2C2C2E',   // Subtle elevation
        'bg-surface': '#3A3A3C',    // Higher elevation surfaces
        'bg-highlight': '#48484A',   // Highest elevation

        // Accent colors (Apple-style blue tones)
        'accent-primary': '#0A84FF',   // iOS-style blue
        'accent-secondary': '#0071E3',  // Apple marketing blue
        'accent-tertiary': '#0077ED',   // Interactive elements
        'accent-deep': '#004AAD',       // Deeper interactions

        // Text colors
        'text-primary': '#FFFFFF',      // Primary text
        'text-secondary': '#98989D',    // Secondary text
        'text-tertiary': '#636366',     // Disabled/inactive text

        // Border colors
        'border-primary': '#4A4A4C',    // Prominent borders (slightly grayer)
        'border-secondary': '#3C3C3E'   // Subtle borders (slightly grayer)
      },
    },
  },
  plugins: [],
}