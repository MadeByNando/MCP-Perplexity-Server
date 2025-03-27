# Publication de l'image Docker

Ce document explique comment créer et publier l'image Docker du serveur MCP Perplexity sur Docker Hub, ce qui est nécessaire pour le déploiement simplifié.

## Prérequis

- Docker installé sur votre machine
- Un compte Docker Hub (https://hub.docker.com/)

## Étapes de publication

1. Connectez-vous à Docker Hub en ligne de commande:

   ```bash
   docker login
   ```

2. Construisez l'image Docker avec votre nom d'utilisateur Docker Hub:

   ```bash
   docker build -t votre_username_docker/mcp-perplexity-server:latest .
   ```

3. Publiez l'image sur Docker Hub:

   ```bash
   docker push votre_username_docker/mcp-perplexity-server:latest
   docker push madebynando/mcp-perplexity-server:latest
   ```

4. Mettez à jour les fichiers suivants pour refléter votre nom d'utilisateur Docker Hub:

   - `docker-compose.yml`: remplacez `madebynando/mcp-perplexity-server:latest` par `votre_username_docker/mcp-perplexity-server:latest`
   - `deploy.sh`: mettez à jour le chemin du fichier docker-compose.yml si nécessaire
   - `README.md`: mettez à jour les exemples pour refléter votre nom d'utilisateur Docker Hub

## Mise à jour de l'image

Pour mettre à jour l'image après des modifications du code:

1. Reconstruisez l'image avec la même étiquette:

   ```bash
   docker build -t madebynando/mcp-perplexity-server:latest .
   ```

2. Publiez l'image mise à jour:

   ```bash
   docker push madebynando/mcp-perplexity-server:latest
   ```

Lorsque les utilisateurs utiliseront `docker-compose up -d` avec un fichier docker-compose.yml qui référence votre image, Docker téléchargera automatiquement la dernière version. 