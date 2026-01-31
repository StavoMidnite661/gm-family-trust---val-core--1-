#!/bin/bash
set -e

# setup_vps.sh
# One-click setup for the SOVR VAL Core VPS

echo "🚀 Starting SOVR VPS Provisioning..."

# 1. Update and Install Docker
echo "📦 Installing Docker Engine..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 2. Setup Firewall (UFW)
echo "🛡️ Configuring Firewall..."
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP (optional if using Nginx reverse proxy)
sudo ufw allow 443/tcp # HTTPS (optional)
sudo ufw allow 3001/tcp # API Access
sudo ufw deny 3000/tcp # Block TigerBeetle external
sudo ufw deny 5432/tcp # Block Postgres external
sudo ufw --force enable

# 3. Create Project Directory
echo "📂 Creating /opt/sovr-val-core..."
sudo mkdir -p /opt/sovr-val-core
sudo chown $USER:$USER /opt/sovr-val-core

echo "✅ VPS Setup Complete. Please upload 'docker-compose.prod.yml' to /opt/sovr-val-core and run:"
echo "   cd /opt/sovr-val-core && docker compose -f docker-compose.prod.yml up -d"
