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

# Check if .env file exists, if not create it
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "PERPLEXITY_API_KEY=your_api_key_here" > .env
    echo ".env file created. Please edit it to add your Perplexity API key."
    echo "Use: nano .env"
else
    echo ".env file already exists."
fi

echo ""
echo "Installation preparation complete. To start the server:"
echo "1. Make sure you've set your Perplexity API key in the .env file"
echo "2. Run: docker-compose up -d"
echo ""
echo "To check logs: docker-compose logs -f"
echo "To stop the server: docker-compose down" 