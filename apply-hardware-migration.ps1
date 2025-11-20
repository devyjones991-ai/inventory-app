# PowerShell скрипт для применения миграции hardware
# Применяет миграцию 20250902000009_add-hardware-fields.sql к локальной БД

Write-Host "=== Применение миграции hardware ===" -ForegroundColor Cyan

$migrationFile = "supabase\migrations\20250902000009_add-hardware-fields.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "Ошибка: Файл миграции не найден: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "`nМиграция будет применена через Supabase Studio" -ForegroundColor Yellow
Write-Host "`nИнструкция:" -ForegroundColor Cyan
Write-Host "1. Откройте Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "2. Перейдите в раздел 'SQL Editor'" -ForegroundColor White
Write-Host "3. Скопируйте содержимое файла: $migrationFile" -ForegroundColor White
Write-Host "4. Вставьте SQL в редактор и нажмите 'Run'" -ForegroundColor White

Write-Host "`nИли используйте psql напрямую:" -ForegroundColor Yellow
Write-Host "psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f $migrationFile" -ForegroundColor White

Write-Host "`nСодержимое миграции:" -ForegroundColor Cyan
Write-Host "---" -ForegroundColor Gray
Get-Content $migrationFile
Write-Host "---" -ForegroundColor Gray


