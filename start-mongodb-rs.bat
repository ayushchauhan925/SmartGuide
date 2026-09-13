@echo off
echo Starting MongoDB replica set instance on port 27018...
start "" /B "E:\MongoDB Community\bin\mongod.exe" --dbpath "E:\MongoDB Community\data-rs" --logpath "E:\MongoDB Community\log-rs\mongod.log" --port 27018 --bind_ip 127.0.0.1 --replSet rs0
timeout /t 3 /nobreak >nul
echo MongoDB started on port 27018.
