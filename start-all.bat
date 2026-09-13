@echo off
echo === SmartGuide2 Startup ===

echo [1/3] Starting MongoDB replica set on port 27018...
start "" /B "E:\MongoDB Community\bin\mongod.exe" --dbpath "E:\MongoDB Community\data-rs" --logpath "E:\MongoDB Community\log-rs\mongod.log" --port 27018 --bind_ip 127.0.0.1 --replSet rs0
timeout /t 3 /nobreak >nul

echo [2/3] Starting backend on port 4000...
start "SmartGuide Backend" cmd /c "cd /d A:\SmartGuide2\backend && npx tsx src/index.ts"
timeout /t 4 /nobreak >nul

echo [3/3] Starting frontend on port 5173...
start "SmartGuide Frontend" cmd /c "cd /d A:\SmartGuide2\frontend && npm run dev"

echo.
echo SmartGuide is starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173
echo Login: admin@smartguide.demo / Admin@123
echo        editor@smartguide.demo / (reset needed)
