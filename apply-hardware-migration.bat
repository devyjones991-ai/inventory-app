@echo off
echo ========================================
echo Применение миграции hardware
echo ========================================
echo.
echo Инструкция:
echo 1. Откройте Supabase Studio: http://localhost:54323
echo 2. Перейдите в SQL Editor
echo 3. Скопируйте SQL из открытого файла
echo 4. Вставьте в SQL Editor и нажмите Run
echo.
echo Открываю файл миграции...
echo.
start notepad supabase\migrations\20250902000009_add-hardware-fields.sql
echo.
echo Файл открыт в Notepad. Скопируйте содержимое и вставьте в Supabase Studio.
echo.
pause


