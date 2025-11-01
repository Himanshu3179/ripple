#!/bin/bash
set -e

echo "🔧 Setting up EC2 environment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
  echo "🐳 Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  echo "✅ Docker installed"
else
  echo "✅ Docker already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
  echo "🐳 Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo "✅ Docker Compose installed"
else
  echo "✅ Docker Compose already installed"
fi

# Setup firewall rules
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
  sudo ufw allow 22/tcp  # SSH
  sudo ufw allow 80/tcp  # HTTP
  sudo ufw allow 443/tcp # HTTPS
  sudo ufw allow 4000/tcp comment "Ripple App" 2>/dev/null || true
  echo "✅ Firewall configured"
fi

# Create app directory
echo "📁 Creating app directory..."
mkdir -p ~/ripple-app
mkdir -p ~/ripple-deploy

# Setup log rotation for Docker containers
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers > /dev/null <<EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

echo "✅ Environment setup completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your GitHub Secrets are configured"
echo "   2. Push to main branch to trigger deployment"
echo "   3. Your app will be available at http://$(curl -s ifconfig.me):4000"

