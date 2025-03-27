#!/bin/bash

# Créer et configurez le builder multi-architecture
docker buildx create --name multiarch-builder --use

# Vérifiez que le builder est bien configuré
echo "Configuration du builder multi-architecture..."
docker buildx inspect --bootstrap

# Construisez et poussez l'image multi-architecture (arm64 et amd64)
echo "Construction et publication de l'image multi-architecture..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t madebynando/mcp-perplexity-server:latest \
  --push .

echo "L'image multi-architecture a été construite et publiée avec succès!"
echo "Elle est maintenant compatible avec les processeurs ARM (Mac M1/M2/M3) et x86_64 (VPS standard)." 