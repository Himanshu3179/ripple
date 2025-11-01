#!/bin/bash
set -e

DOMAIN=$1

echo "🔧 Setting up Nginx..."

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
  echo "📦 Installing Nginx..."
  sudo apt-get update
  sudo apt-get install -y nginx
  sudo systemctl enable nginx
fi

# Create Nginx configuration
NGINX_CONFIG="/etc/nginx/sites-available/ripple"
DOMAIN_CONFIG=""

if [ -n "$DOMAIN" ]; then
  DOMAIN_CONFIG="server_name ${DOMAIN} www.${DOMAIN};"
else
  DOMAIN_CONFIG="server_name _;"
fi

# Create Nginx config
sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
server {
    listen 80;
    $DOMAIN_CONFIG

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
if [ ! -L "/etc/nginx/sites-enabled/ripple" ]; then
  sudo ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/
fi

# Remove default site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
  sudo rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
  echo "✅ Nginx configuration is valid"
  # Reload Nginx
  sudo systemctl reload nginx
  echo "✅ Nginx reloaded successfully"
else
  echo "❌ Nginx configuration test failed"
  exit 1
fi

# Setup SSL with Let's Encrypt if domain is provided
if [ -n "$DOMAIN" ]; then
  echo "🔒 Setting up SSL certificate..."
  
  # Check if certbot is installed
  if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx
  fi
  
  # Check if certificate already exists
  if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "📜 Obtaining SSL certificate..."
    sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN || {
      echo "⚠️  SSL certificate setup failed or skipped. You can set it up manually later."
    }
  else
    echo "✅ SSL certificate already exists"
    # Renew certificate if needed
    sudo certbot renew --dry-run || true
  fi
fi

echo "✅ Nginx setup completed!"

