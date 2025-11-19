# Скрипт установки и настройки локального Supabase на Windows

Write-Host "=== Установка локального Supabase ===" -ForegroundColor Green

# Проверка наличия Docker
Write-Host "`n[1/5] Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker найден: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker не найден! Установите Docker Desktop для Windows" -ForegroundColor Red
    exit 1
}

# Проверка наличия Docker Compose
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose найден: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose не найден!" -ForegroundColor Red
    exit 1
}

# Установка Supabase CLI через Scoop (если установлен)
Write-Host "`n[2/5] Установка Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = $false

# Проверка через Scoop
if (Get-Command scoop -ErrorAction SilentlyContinue) {
    Write-Host "Попытка установки через Scoop..." -ForegroundColor Cyan
    try {
        scoop install supabase
        $supabaseInstalled = $true
        Write-Host "✓ Supabase CLI установлен через Scoop" -ForegroundColor Green
    } catch {
        Write-Host "Не удалось установить через Scoop" -ForegroundColor Yellow
    }
}

# Если не установлен, скачиваем бинарник
if (-not $supabaseInstalled) {
    Write-Host "Скачивание Supabase CLI..." -ForegroundColor Cyan
    $supabaseVersion = "1.200.0"
    $downloadUrl = "https://github.com/supabase/cli/releases/download/v$supabaseVersion/supabase_windows_amd64.zip"
    $tempDir = "$env:TEMP\supabase-cli"
    $zipPath = "$tempDir\supabase.zip"
    $binPath = "$env:LOCALAPPDATA\supabase\bin"
    
    # Создаем директории
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    New-Item -ItemType Directory -Force -Path $binPath | Out-Null
    
    # Скачиваем
    Write-Host "Загрузка Supabase CLI v$supabaseVersion..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
    
    # Распаковываем
    Expand-Archive -Path $zipPath -DestinationPath $binPath -Force
    
    # Добавляем в PATH (для текущей сессии)
    $env:Path += ";$binPath"
    
    # Добавляем в PATH постоянно
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$binPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$userPath;$binPath", "User")
    }
    
    Write-Host "✓ Supabase CLI установлен в $binPath" -ForegroundColor Green
    Write-Host "⚠ Перезапустите терминал или выполните: `$env:Path += ';$binPath'" -ForegroundColor Yellow
}

# Проверка установки
try {
    $supabaseVersion = supabase --version
    Write-Host "✓ Supabase CLI: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI не найден. Установите вручную:" -ForegroundColor Red
    Write-Host "  scoop install supabase" -ForegroundColor Cyan
    Write-Host "  или скачайте с https://github.com/supabase/cli/releases" -ForegroundColor Cyan
    exit 1
}

# Инициализация Supabase (если еще не инициализирован)
Write-Host "`n[3/5] Проверка инициализации Supabase..." -ForegroundColor Yellow
if (Test-Path "supabase\config.toml") {
    Write-Host "✓ Supabase уже инициализирован" -ForegroundColor Green
} else {
    Write-Host "Инициализация Supabase проекта..." -ForegroundColor Cyan
    supabase init
    Write-Host "✓ Supabase инициализирован" -ForegroundColor Green
}

# Запуск локального Supabase
Write-Host "`n[4/5] Запуск локального Supabase..." -ForegroundColor Yellow
Write-Host "Это может занять несколько минут при первом запуске..." -ForegroundColor Cyan
supabase start

# Получение URL и ключей
Write-Host "`n[5/5] Получение конфигурации..." -ForegroundColor Yellow
$status = supabase status

# Парсим вывод для получения URL и ключей
$apiUrl = ""
$anonKey = ""
$dbUrl = ""

if ($status -match "API URL:\s*(.+)") {
    $apiUrl = $matches[1].Trim()
}
if ($status -match "anon key:\s*(.+)") {
    $anonKey = $matches[1].Trim()
}
if ($status -match "DB URL:\s*(.+)") {
    $dbUrl = $matches[1].Trim()
}

Write-Host "`n=== Конфигурация локального Supabase ===" -ForegroundColor Green
Write-Host "API URL: $apiUrl" -ForegroundColor Cyan
Write-Host "Anon Key: $anonKey" -ForegroundColor Cyan
Write-Host "DB URL: $dbUrl" -ForegroundColor Cyan

# Применение миграций
Write-Host "`nПрименение миграций..." -ForegroundColor Yellow
supabase db reset

Write-Host "`n=== Установка завершена! ===" -ForegroundColor Green
Write-Host "`nДобавьте в .env файл:" -ForegroundColor Yellow
Write-Host "VITE_SUPABASE_URL=$apiUrl" -ForegroundColor Cyan
Write-Host "VITE_SUPABASE_ANON_KEY=$anonKey" -ForegroundColor Cyan
Write-Host "`nИли обновите public/env.js с этими значениями" -ForegroundColor Yellow

