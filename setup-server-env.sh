#!/bin/bash

echo "🔧 Setting up server environment variables..."

# Navigate to project directory
cd ~/inventory-app

# Create public/env.js with environment variables
echo "📝 Creating public/env.js..."
cat > public/env.js << 'EOF'
// Runtime environment overrides for static hosting
window.__ENV = {
  VITE_SUPABASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg",
  VITE_API_BASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co/functions/v1"
};
EOF

echo "✅ Environment variables configured!"
echo "🌐 Variables will be available at runtime"
