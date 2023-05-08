#!/bin/bash
echo "Installing Git on macOS..."

if command -v git > /dev/null 2>&1; then
    echo "Git is already installed."
else
    echo "Checking for Homebrew..."
    if command -v brew > /dev/null 2>&1; then
        echo "Homebrew found. Installing Git..."
        brew install git
    else
        echo "Homebrew not found. Installing Homebrew and Git..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install git
    fi
fi

echo "Git installation completed."
echo "Installing Node.js..."
installer -pkg node-v18.16.0.pkg -target /
echo "Installing dependencies..."
git clone https://github.com/daveckw/express_whatsappweb.git
cd express_whatsappweb
npm install
echo "Starting the app..."
node index.js
