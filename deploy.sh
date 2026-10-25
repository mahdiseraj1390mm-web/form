#!/bin/bash
set -e

echo "========================================="
echo "🚀 Starting BelHagh Form Server Setup..."
echo "========================================="

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install essential tools and Git
echo "📦 Installing Git, curl, and build tools..."
sudo apt install -y curl git build-essential nginx ufw

# 3. Install Node.js 22.x LTS
echo "📦 Installing Node.js 22.x LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

# 4. Install PM2 globally
echo "📦 Installing PM2 globally..."
sudo npm install -g pm2

# 5. Setup Project Directory
APP_DIR="/var/www/belhagh-form"
REPO_URL="https://github.com/mahdiseraj1390mm-web/form.git"

if [ -d "$APP_DIR" ]; then
    echo "🔄 Existing project directory found. Pulling latest changes..."
    cd "$APP_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    echo "📥 Cloning project from GitHub..."
    sudo mkdir -p /var/www
    sudo chown -R $USER:$USER /var/www
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 6. Install dependencies and build
echo "🔨 Installing npm dependencies..."
npm install

echo "🏗️ Building Next.js application..."
npm run build

# 7. Start/Reload with PM2
echo "⚡ Starting application with PM2..."
if pm2 describe belhagh-form > /dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs || pm2 restart belhagh-form
else
    pm2 start ecosystem.config.cjs
fi

pm2 save

echo "🔧 Setting up PM2 auto-startup..."
# Run startup command automatically if user is root, or show prompt
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

# 8. Configure Nginx
echo "🌐 Configuring Nginx reverse proxy..."
NGINX_CONF="/etc/nginx/sites-available/belhagh-form"

sudo bash -c "cat > $NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name _;

    # Gzip Compression
    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable Nginx site
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx

# 9. Configure Firewall
echo "🛡️ Configuring UFW firewall..."
sudo ufw allow 'OpenSSH'
sudo ufw allow 'Nginx Full'
sudo ufw --force enable || true

echo "========================================="
echo "✅ Server setup & deployment completed successfully!"
echo "🌐 Your app is now running on port 80!"
echo "ℹ️  Run 'pm2 status' or 'pm2 logs belhagh-form' to check logs."
echo "========================================="
