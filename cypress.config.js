import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "e2e/support/e2e.js",
    fixturesFolder: "e2e/fixtures",
  },
});
