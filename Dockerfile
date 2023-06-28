# Use the official Node.js 16 image from Docker Hub
FROM node:16

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files into the Docker image
COPY package*.json ./

# Install the application dependencies inside the Docker image
RUN npm install

# Copy the rest of the application code into the Docker image
COPY . .

# Instruct Docker to listen on port 8080
EXPOSE 8080

# Install the dependencies
RUN apt-get update && apt-get install -y \
    gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
    libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
    libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Start the application
CMD [ "node", "index.js" ]
