# Enhanced deployment script for multiminder.duckdns.org (Windows PowerShell)
param(
    [switch]$SkipBuild,
    [switch]$SkipTest
)

Write-Host "🚀 Starting enhanced deployment..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Error ".env file not found! Please create it with required variables:"
    Write-Host "VITE_SUPABASE_URL=https://your-project.supabase.co"
    Write-Host "VITE_SUPABASE_ANON_KEY=your-anon-key"
    Write-Host "VITE_API_BASE_URL=https://multiminder.duckdns.org/api"
    exit 1
}

Write-Success ".env file found"

# Check if all required variables are set
Write-Status "Checking environment variables..."
$envContent = Get-Content ".env" -Raw

if (-not $envContent.Contains("VITE_SUPABASE_URL=")) {
    Write-Error "VITE_SUPABASE_URL is not set in .env"
    exit 1
}

if (-not $envContent.Contains("VITE_SUPABASE_ANON_KEY=")) {
    Write-Error "VITE_SUPABASE_ANON_KEY is not set in .env"
    exit 1
}

if (-not $envContent.Contains("VITE_API_BASE_URL=")) {
    Write-Warning "VITE_API_BASE_URL is not set in .env (optional)"
}

Write-Success "Environment variables check passed"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Status "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed"
} else {
    Write-Success "Dependencies already installed"
}

# Build the project
if (-not $SkipBuild) {
    Write-Status "Building project..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        exit 1
    }
    Write-Success "Build completed"
}

# Check build output
if (-not (Test-Path "dist")) {
    Write-Error "Build failed - dist directory not found"
    exit 1
}

# Check for .jsx files that might cause MIME issues
Write-Status "Checking for potential MIME type issues..."
$jsxFiles = Get-ChildItem -Path "dist/assets" -Filter "*.jsx" -ErrorAction SilentlyContinue
if ($jsxFiles) {
    Write-Warning "Found .jsx files in dist/assets:"
    $jsxFiles | ForEach-Object { Write-Host "  $($_.FullName)" }
    Write-Warning "This may cause MIME type issues on the server"
} else {
    Write-Success "No .jsx files found (good for MIME types)"
}

# Display deployment information
Write-Host ""
Write-Success "🎉 Build completed successfully!"
Write-Host ""
Write-Host "📋 Next steps for server deployment:"
Write-Host "1. Copy the 'dist' folder to your server"
Write-Host "2. Run the deploy-enhanced.sh script on the server"
Write-Host "3. Or manually copy files to /var/www/multiminder.duckdns.org/"
Write-Host "4. Set proper permissions: sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/"
Write-Host "5. Configure nginx with the provided nginx.conf or nginx-http.conf"
Write-Host "6. For HTTPS: sudo certbot --nginx -d multiminder.duckdns.org"
Write-Host ""
Write-Host "🔧 Troubleshooting:"
Write-Host "- If you see MIME type errors, check nginx configuration"
Write-Host "- If you see CORS errors, check Supabase settings"
Write-Host "- If you see 404 errors, check file permissions"
Write-Host ""
Write-Success "Windows build script completed!"
