#!/usr/bin/env node

// Deployment diagnostic script
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Checking deployment readiness...\n");

// Check if .env file exists
const envPath = ".env";
if (fs.existsSync(envPath)) {
  console.log("✅ .env file exists");
  const envContent = fs.readFileSync(envPath, "utf8");
  const hasSupabaseUrl = envContent.includes("VITE_SUPABASE_URL=");
  const hasSupabaseKey = envContent.includes("VITE_SUPABASE_ANON_KEY=");
  const hasApiUrl = envContent.includes("VITE_API_BASE_URL=");

  console.log(`   VITE_SUPABASE_URL: ${hasSupabaseUrl ? "✅" : "❌"}`);
  console.log(`   VITE_SUPABASE_ANON_KEY: ${hasSupabaseKey ? "✅" : "❌"}`);
  console.log(`   VITE_API_BASE_URL: ${hasApiUrl ? "✅" : "❌"}`);
} else {
  console.log("❌ .env file not found");
}

// Check package.json scripts
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
console.log("\n📦 Package.json scripts:");
console.log(`   build: ${packageJson.scripts.build ? "✅" : "❌"}`);
console.log(
  `   deploy:prod: ${packageJson.scripts["deploy:prod"] ? "✅" : "❌"}`,
);
console.log(
  `   docker:build: ${packageJson.scripts["docker:build"] ? "✅" : "❌"}`,
);

// Check nginx configs
const nginxFiles = ["nginx.conf", "nginx-http.conf"];
console.log("\n🌐 Nginx configurations:");
nginxFiles.forEach((file) => {
  console.log(`   ${file}: ${fs.existsSync(file) ? "✅" : "❌"}`);
});

// Check deployment script
console.log("\n🚀 Deployment script:");
console.log(`   deploy.sh: ${fs.existsSync("deploy.sh") ? "✅" : "❌"}`);

// Check Docker files
const dockerFiles = ["Dockerfile.nginx", "docker-compose.prod.yml"];
console.log("\n🐳 Docker files:");
dockerFiles.forEach((file) => {
  console.log(`   ${file}: ${fs.existsSync(file) ? "✅" : "❌"}`);
});

// Check if dist directory exists (after build)
console.log("\n📁 Build output:");
if (fs.existsSync("dist")) {
  console.log("   dist directory: ✅");
  const distFiles = fs.readdirSync("dist");
  console.log(`   Files in dist: ${distFiles.length}`);

  // Check for .jsx files that might cause MIME issues
  const jsxFiles = distFiles.filter((f) => f.endsWith(".jsx"));
  if (jsxFiles.length > 0) {
    console.log(`   ⚠️  Found .jsx files: ${jsxFiles.join(", ")}`);
  } else {
    console.log("   ✅ No .jsx files found (good for MIME types)");
  }
} else {
  console.log("   dist directory: ❌ (run npm run build first)");
}

console.log("\n🎯 Deployment recommendations:");
console.log("1. Ensure .env file has all required variables");
console.log("2. Run: npm run build");
console.log("3. On server: ./deploy.sh");
console.log("4. For HTTPS: sudo certbot --nginx -d multiminder.duckdns.org");
console.log("5. Check nginx logs: sudo tail -f /var/log/nginx/error.log");
