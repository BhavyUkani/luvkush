#!/bin/bash

# ==============================================================================
# Luv Kush Natural - VPS Deployment Script (Direct Deployment via SSH/SCP)
# ==============================================================================
# This script builds the backend and frontend locally, packages them, and uploads
# them to your VPS. It also outlines the server-side setup instructions.
#
# Prerequisite: SSH key authentication configured with your VPS for passwordless login.
# ==============================================================================

# --- CONFIGURATION VARIABLES ---
VPS_USER="root"                      # SSH username for VPS
VPS_IP="87.232.72.40"                 # IP address of your VPS
VPS_PORT="22"                        # SSH Port
TARGET_DIR="/var/www/luvkush"        # Target directory on the VPS
TEMP_DIR="./tmp_deploy"              # Local temporary directory for packaging

# --- COLOR FORMATTING ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  Starting Direct VPS Deployment (Without Git)        ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check if IP is set
if [ "$VPS_IP" == "your_vps_ip" ]; then
    echo -e "${RED}[ERROR] Please open this script and configure your VPS_IP first!${NC}"
    exit 1
fi

# 1. CLEAN LOCAL TEMP DIRECTORIES
echo -e "\n${YELLOW}[1/6] Cleaning up temporary directories...${NC}"
rm -rf "$TEMP_DIR"
rm -f deploy.tar.gz

# 2. BUILD BACKEND
echo -e "\n${YELLOW}[2/6] Building Backend...${NC}"
cd backend
if [ -d "node_modules" ]; then
    npm run build
else
    echo -e "${BLUE}node_modules not found, running npm install first...${NC}"
    npm install && npm run build
fi
cd ..

# 3. BUILD FRONTEND (Angular SSR)
echo -e "\n${YELLOW}[3/6] Building Frontend (Angular SSR)...${NC}"
cd frontend
if [ -d "node_modules" ]; then
    npm run build
else
    echo -e "${BLUE}node_modules not found, running npm install first...${NC}"
    npm install && npm run build
fi
cd ..

# 4. PACKAGE FOR DEPLOYMENT
echo -e "\n${YELLOW}[4/6] Packaging build files...${NC}"
mkdir -p "$TEMP_DIR/backend"
mkdir -p "$TEMP_DIR/frontend"

# Copy Backend Files (exclude typescript files, node_modules, tests, logs)
cp -r backend/dist "$TEMP_DIR/backend/"
cp backend/package.json "$TEMP_DIR/backend/"
cp backend/package-lock.json "$TEMP_DIR/backend/"
# Copy Migrations and Seeders if any
if [ -d "backend/migrations" ]; then
    cp -r backend/migrations "$TEMP_DIR/backend/"
fi
# Copy .env configuration if it exists locally as template
if [ -f "backend/.env" ]; then
    cp backend/.env "$TEMP_DIR/backend/.env.example"
fi

# Copy Frontend Files
cp -r frontend/dist "$TEMP_DIR/frontend/"
cp frontend/package.json "$TEMP_DIR/frontend/"
cp frontend/package-lock.json "$TEMP_DIR/frontend/"

# Create ecosystem.config.js for PM2
cat <<EOT > "$TEMP_DIR/ecosystem.config.js"
module.exports = {
  apps: [
    {
      name: 'luvkush-backend',
      script: './backend/dist/server.js',
      cwd: '${TARGET_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'luvkush-frontend',
      script: './frontend/dist/luvkush-natural/server/server.mjs',
      cwd: '${TARGET_DIR}',
      env: {
        PORT: 4000,
        NODE_ENV: 'production'
      }
    }
  ]
};
EOT

# Create tarball
tar -czf deploy.tar.gz -C "$TEMP_DIR" .
rm -rf "$TEMP_DIR"

echo -e "${GREEN}[SUCCESS] packaged build files into deploy.tar.gz${NC}"

# 5. UPLOAD TO VPS
echo -e "\n${YELLOW}[5/6] Uploading package to VPS via SCP...${NC}"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "mkdir -p $TARGET_DIR"
scp -P "$VPS_PORT" deploy.tar.gz "$VPS_USER@$VPS_IP:$TARGET_DIR/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS] Uploaded deploy.tar.gz to VPS.${NC}"
else
    echo -e "${RED}[ERROR] Failed to upload files to VPS. Check SSH configuration.${NC}"
    exit 1
fi

# 6. EXTRACT AND RESTART ON SERVER
echo -e "\n${YELLOW}[6/6] Extracting files and starting services on VPS...${NC}"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" << EOF
  cd $TARGET_DIR
  
  echo "Extracting release..."
  tar -xzf deploy.tar.gz
  rm deploy.tar.gz

  # Install Backend production dependencies
  echo "Installing backend dependencies..."
  cd backend
  npm ci --omit=dev
  
  # Run migrations
  if [ -f "dist/utils/migrate.js" ]; then
    echo "Running database migrations..."
    npm run db:migrate
  fi

  # Install Frontend production dependencies
  echo "Installing frontend dependencies..."
  cd ../frontend
  npm ci --omit=dev

  cd ..

  # Initialize / Update production .env file if it does not exist
  if [ ! -f "backend/.env" ]; then
    echo "Copying template .env file..."
    if [ -f "backend/.env.example" ]; then
      cp backend/.env.example backend/.env
      echo -e "${YELLOW}[WARNING] Created default backend/.env. Please configure your actual DB and payment keys on the VPS!${NC}"
    fi
  fi

  # Restart services using PM2
  if command -v pm2 &> /dev/null; then
    echo "Stopping and deleting existing PM2 processes to reset configurations..."
    pm2 delete luvkush-backend 2>/dev/null || true
    pm2 delete luvkush-frontend 2>/dev/null || true
    echo "Starting applications with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
  else
    echo "PM2 is not installed globally on VPS. Installing PM2..."
    npm install -g pm2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
  fi
EOF

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}  Deployment Process Completed Successfully!         ${NC}"
echo -e "${GREEN}=====================================================${NC}"

# --- MANUAL VPS SETUP CHECKS ---
echo -e "\n${BLUE}--- VPS Server Initialization Checklist ---${NC}"
echo -e "If this is the FIRST time you are deploying, ensure you have setup Nginx:"
echo -e "\n1. Install Nginx, Node.js, and MySQL on the VPS:"
echo -e "   sudo apt update"
echo -e "   sudo apt install nginx mysql-server -y"
echo -e "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
echo -e "   sudo apt install -y nodejs"
echo -e "\n2. Nginx Site Configuration (/etc/nginx/sites-available/luvkush):"
echo -e "   ------------------------------------------------------------"
echo -e "   server {"
echo -e "       listen 80;"
echo -e "       server_name yourdomain.com www.yourdomain.com;"
echo -e ""
echo -e "       # Frontend Angular SSR"
echo -e "       location / {"
echo -e "           proxy_pass http://127.0.0.1:4000;"
echo -e "           proxy_http_version 1.1;"
echo -e "           proxy_set_header Upgrade \$http_upgrade;"
echo -e "           proxy_set_header Connection 'upgrade';"
echo -e "           proxy_set_header Host \$host;"
echo -e "           proxy_cache_bypass \$http_upgrade;"
echo -e "       }"
echo -e ""
echo -e "       # Backend API"
echo -e "       location /api/ {"
echo -e "           proxy_pass http://127.0.0.1:5000;"
echo -e "           proxy_http_version 1.1;"
echo -e "           proxy_set_header Upgrade \$http_upgrade;"
echo -e "           proxy_set_header Connection 'upgrade';"
echo -e "           proxy_set_header Host \$host;"
echo -e "           proxy_cache_bypass \$http_upgrade;"
echo -e "       }"
echo -e "   }"
echo -e "   ------------------------------------------------------------"
echo -e "   Link it and reload Nginx:"
echo -e "   sudo ln -s /etc/nginx/sites-available/luvkush /etc/nginx/sites-enabled/"
echo -e "   sudo nginx -t && sudo systemctl restart nginx"
echo -e "\n3. Certbot SSL setup (HTTPS):"
echo -e "   sudo apt install certbot python3-certbot-nginx -y"
echo -e "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo -e "====================================================="
