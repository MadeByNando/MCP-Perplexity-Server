#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully."
else
    echo "Docker Compose is already installed."
fi

# Create deployment directory if it doesn't exist
mkdir -p mcp-perplexity-deployment
cd mcp-perplexity-deployment

# Download docker-compose.yml if it doesn't exist
if [ ! -f docker-compose.yml ]; then
    echo "Downloading docker-compose.yml..."
    curl -L https://raw.githubusercontent.com/MadeByNando/mcp-perplexity-server/main/docker-compose.yml -o docker-compose.yml
fi

# Download .env.example file
echo "Downloading .env.example..."
curl -L https://raw.githubusercontent.com/MadeByNando/mcp-perplexity-server/main/.env.example -o .env.example

# Check if .env file exists, if not create it from .env.example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ".env file created. Please edit it to add your Perplexity API key."
    echo "Use: nano .env"
else
    echo ".env file already exists."
fi

echo ""
echo "Deployment preparation complete. To start the server:"
echo "1. Make sure you've set your Perplexity API key in the .env file"
echo "   The .env.example file contains all available configuration options"
echo "2. Run: docker-compose up -d"
echo ""
echo "To check logs: docker-compose logs -f"
echo "To stop the server: docker-compose down" 