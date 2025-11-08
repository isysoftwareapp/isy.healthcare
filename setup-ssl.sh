#!/bin/bash
# Setup SSL certificate for health.isy.software

echo "=== Setting up SSL certificate for health.isy.software ==="

cd /home/adminroot/isy.healthcare

# Create certbot directories
mkdir -p certbot/conf certbot/www

# Stop existing containers
echo "Stopping containers..."
sudo docker-compose down

# Temporarily use HTTP-only nginx config
echo "Starting nginx with HTTP only..."
cp nginx-http-only.conf nginx.conf

# Start only the app and nginx (without SSL)
sudo docker-compose up -d app nginx

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Get SSL certificate
echo "Requesting SSL certificate..."
sudo docker run --rm \
  --network isy-healthcare_default \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --email admin@isy.software --agree-tos --no-eff-email \
  -d health.isy.software

if [ $? -eq 0 ]; then
    echo "SSL certificate obtained successfully!"
    
    # Restore full nginx config with SSL
    echo "Restoring SSL nginx config..."
    cp nginx-ssl.conf nginx.conf
    
    # Restart nginx with SSL
    sudo docker-compose restart nginx
    
    echo "=== Setup complete! ==="
    echo "Your app is now accessible at https://health.isy.software"
else
    echo "Failed to obtain SSL certificate. Check your DNS settings."
    echo "Make sure health.isy.software points to this server's IP."
fi
