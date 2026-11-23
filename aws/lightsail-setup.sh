#!/bin/bash
# ==============================================================================
# The Mind Upgrade — Automated Lightsail Production Setup Script
# Target: Ubuntu 22.04 / 24.04 LTS on AWS Lightsail ($3.50 - $5.00/month plan)
# ==============================================================================

set -e

DOMAIN="themindupgrade.in"
WWW_DOMAIN="www.themindupgrade.in"
EMAIL="contact@themindupgrade.in"

echo "=========================================================="
echo " 🚀 Setting up The Mind Upgrade on AWS Lightsail"
echo "=========================================================="

# 1. Update and install base packages
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw nginx certbot python3-certbot-nginx

# 2. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
fi

# 3. Configure Firewall (UFW)
echo "🛡️ Configuring Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx reverse proxy for $DOMAIN..."
sudo cat << 'EOF' > /etc/nginx/sites-available/themindupgrade
server {
    listen 80;
    server_name themindupgrade.in www.themindupgrade.in;

    # Gzip Compression for Fast Editorial Reading
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase buffer and timeout for large uploads / article content
        client_max_body_size 25M;
        proxy_read_timeout 90;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/themindupgrade /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 5. Acquire Free SSL with Certbot
echo "🔒 Requesting SSL Certificate from Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect || true

echo "=========================================================="
echo "✅ Server Configuration Complete!"
echo "Next step: Run 'docker compose up -d --build' in your app directory."
echo "Your site will be live at https://$DOMAIN"
echo "=========================================================="
