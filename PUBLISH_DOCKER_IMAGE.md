# Publication de l'image Docker

Ce document explique comment créer et publier l'image Docker du serveur MCP Perplexity sur Docker Hub, ce qui est nécessaire pour le déploiement simplifié.

## Prérequis

- Docker installé sur votre machine
- Un compte Docker Hub (https://hub.docker.com/)
- Docker buildx (inclus dans les versions récentes de Docker Desktop)

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

### Option 1: Construction standard (architecture unique)

Pour mettre à jour l'image après des modifications du code:

1. Reconstruisez l'image avec la même étiquette:

   ```bash
   docker build -t madebynando/mcp-perplexity-server:latest .
   ```

2. Publiez l'image mise à jour:

   ```bash
   docker push madebynando/mcp-perplexity-server:latest
   ```

### Option 2: Construction multi-architecture (recommandée)

Cette méthode crée une image qui fonctionne à la fois sur les architectures ARM64 (Mac M1/M2/M3) et AMD64 (VPS standard).

1. Configurez un builder multi-architecture:

   ```bash
   docker buildx create --name multiarch-builder --use
   docker buildx inspect --bootstrap
   ```

2. Construisez et publiez l'image pour plusieurs architectures:

   ```bash
   docker buildx build --platform linux/amd64,linux/arm64 \
     -t madebynando/mcp-perplexity-server:latest \
     --push .
   ```

Vous pouvez également utiliser le script `build-multiarch.sh` fourni:

```bash
chmod +x build-multiarch.sh
./build-multiarch.sh
```

### Vérification de l'image publiée

Pour vérifier que votre image multi-architecture a été correctement publiée:

```bash
docker buildx imagetools inspect madebynando/mcp-perplexity-server:latest
```

Vous devriez voir les deux architectures (linux/amd64 et linux/arm64) listées dans les manifestes.

Lorsque les utilisateurs utiliseront `docker-compose up -d` avec un fichier docker-compose.yml qui référence votre image, Docker téléchargera automatiquement la dernière version adaptée à leur architecture.

## Mise à jour de l'image côté serveur

Après avoir publié une nouvelle version de l'image sur Docker Hub, suivez ces étapes pour mettre à jour l'installation sur votre serveur:

1. Connectez-vous à votre serveur via SSH:

   ```bash
   ssh utilisateur@adresse-ip-serveur
   ```

2. Naviguez vers le répertoire contenant votre `docker-compose.yml`:

   ```bash
   cd mcp-perplexity-deployment
   ```

3. Tirez la dernière version de l'image:

   ```bash
   docker-compose pull
   ```

4. Redémarrez les services avec la nouvelle image:

   ```bash
   docker-compose down
   docker-compose up -d
   ```

5. Vérifiez que le conteneur fonctionne correctement:

   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Mise à jour automatique (optionnel)

Pour une mise à jour automatique, vous pouvez configurer un webhook Docker Hub ou utiliser un service comme Watchtower:

#### Utilisation de Watchtower

Watchtower surveille automatiquement les images Docker et met à jour les conteneurs lorsque de nouvelles versions sont disponibles:

1. Ajoutez Watchtower à votre `docker-compose.yml`:

   ```yaml
   services:
     # ... vos services existants ...
     
     watchtower:
       image: containrrr/watchtower
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
       command: --interval 86400 --cleanup
       restart: unless-stopped
   ```

2. Redémarrez avec le nouveau service:

   ```bash
   docker-compose up -d
   ```

Cette configuration vérifiera les mises à jour une fois par jour et mettra à jour automatiquement votre conteneur MCP Perplexity lorsqu'une nouvelle version est disponible. 