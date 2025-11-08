#!/bin/bash

# Deploy script for isy.healthcare to VPS

echo "=== Deploying isy.healthcare to VPS ==="

# Configuration
VPS_IP="103.126.116.50"
VPS_USER="adminroot"
APP_DIR="/home/adminroot/isy.healthcare"
DOMAIN="health.isy.software"

# Create app directory on VPS
echo "Creating app directory on VPS..."
ssh -i ~/.ssh/id_rsa $VPS_USER@$VPS_IP "mkdir -p $APP_DIR"

# Copy files to VPS
echo "Copying files to VPS..."
scp -i ~/.ssh/id_rsa -r ./* $VPS_USER@$VPS_IP:$APP_DIR/

# SSH into VPS and setup
echo "Setting up Docker containers on VPS..."
ssh -i ~/.ssh/id_rsa $VPS_USER@$VPS_IP << 'EOF'
cd /home/adminroot/isy.healthcare

# Stop and remove existing containers
docker-compose down 2>/dev/null || true

# Create certbot directories
mkdir -p certbot/conf certbot/www

# First, run nginx without SSL to get certificate
cat > nginx-init.conf << 'NGINX_INIT'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name health.isy.software;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
NGINX_INIT

# Build and start app only
docker-compose up -d app

# Wait for app to be ready
sleep 5

# Start nginx with init config
docker run -d --name temp-nginx \
  --network isy-healthcare_default \
  -p 80:80 \
  -v $(pwd)/nginx-init.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/certbot/www:/var/www/certbot \
  nginx:alpine

# Get SSL certificate
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --email admin@isy.software --agree-tos --no-eff-email \
  -d health.isy.software

# Stop temporary nginx
docker stop temp-nginx
docker rm temp-nginx

# Start all services with SSL
docker-compose up -d

echo "=== Deployment complete! ==="
echo "Your app should be accessible at https://health.isy.software"
EOF

echo "=== Deployment finished! ==="
echo "Visit https://health.isy.software to see your app"
