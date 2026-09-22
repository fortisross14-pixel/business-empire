import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative asset URLs make the production bundle portable across GitHub Pages
// repository names (and also work for local static previews).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
