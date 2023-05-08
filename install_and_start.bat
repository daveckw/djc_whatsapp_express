@echo off
echo Downloading Git for Windows...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.40.1.windows.1/Git-2.40.1-64-bit.exe' -OutFile '%TEMP%\GitInstaller.exe'"

echo Installing Git for Windows...
"%TEMP%\GitInstaller.exe" /VERYSILENT

echo Removing installer...
del "%TEMP%\GitInstaller.exe"

echo Git installation completed.
git clone https://github.com/daveckw/express_whatsappweb.git
pause
echo Installing Node.js...
start /wait node-v18.16.0-x64.msi /quiet
echo Installing dependencies...
cd express_whatsappweb
call npm install
echo Installation completed.
pause

