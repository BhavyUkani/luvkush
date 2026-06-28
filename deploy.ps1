# ==============================================================================
# Luv Kush Natural - VPS Deployment Script for Windows (PowerShell)
# ==============================================================================
# This script builds the backend and frontend locally, packages them, and uploads
# them to your VPS. It also outlines the server-side setup instructions.
#
# Prerequisite: Windows OpenSSH client installed (native on Windows 10/11)
# ==============================================================================

# --- CONFIGURATION VARIABLES ---
$VPS_USER = "root"
$VPS_IP = "87.232.72.40"
$VPS_PORT = "22"
$TARGET_DIR = "/var/www/luvkush"
$TEMP_DIR = "./tmp_deploy"

Write-Host "=====================================================" -ForegroundColor Blue
Write-Host "  Starting Direct VPS Deployment (Windows PowerShell) " -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Blue

# 1. CLEAN LOCAL TEMP DIRECTORIES
Write-Host "`n[1/6] Cleaning up temporary directories..." -ForegroundColor Yellow
if (Test-Path $TEMP_DIR) { Remove-Item -Recurse -Force $TEMP_DIR }
if (Test-Path deploy.zip) { Remove-Item -Force deploy.zip }

# 2. BUILD BACKEND
Write-Host "`n[2/6] Building Backend..." -ForegroundColor Yellow
Push-Location backend
if (-not (Test-Path node_modules)) {
    Write-Host "node_modules not found, running npm install first..." -ForegroundColor Blue
    npm install
}
npm run build
Pop-Location

# 3. BUILD FRONTEND (Angular SSR)
Write-Host "`n[3/6] Building Frontend (Angular SSR)..." -ForegroundColor Yellow
Push-Location frontend
if (-not (Test-Path node_modules)) {
    Write-Host "node_modules not found, running npm install first..." -ForegroundColor Blue
    npm install
}
npm run build
Pop-Location

# 4. PACKAGE FOR DEPLOYMENT
Write-Host "`n[4/6] Packaging build files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$TEMP_DIR/backend" | Out-Null
New-Item -ItemType Directory -Force -Path "$TEMP_DIR/frontend" | Out-Null

# Copy Backend Files (exclude typescript files, node_modules, tests, logs)
Copy-Item -Recurse -Force backend/dist "$TEMP_DIR/backend/"
Copy-Item backend/package.json "$TEMP_DIR/backend/"
Copy-Item backend/package-lock.json "$TEMP_DIR/backend/"

if (Test-Path backend/migrations) {
    Copy-Item -Recurse -Force backend/migrations "$TEMP_DIR/backend/"
}
if (Test-Path backend/.env) {
    Copy-Item backend/.env "$TEMP_DIR/backend/.env.example"
}

# Copy Frontend Files
Copy-Item -Recurse -Force frontend/dist "$TEMP_DIR/frontend/"
Copy-Item frontend/package.json "$TEMP_DIR/frontend/"
Copy-Item frontend/package-lock.json "$TEMP_DIR/frontend/"

# Create ecosystem.config.js for PM2
$EcosystemContent = @"
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
"@
Set-Content -Path "$TEMP_DIR/ecosystem.config.js" -Value $EcosystemContent

# Create zip archive
Compress-Archive -Path "$TEMP_DIR/*" -DestinationPath deploy.zip -Force
Remove-Item -Recurse -Force $TEMP_DIR

Write-Host "[SUCCESS] Packaged build files into deploy.zip" -ForegroundColor Green

# 5. UPLOAD TO VPS
Write-Host "`n[5/6] Uploading package to VPS via SCP..." -ForegroundColor Yellow
# Ensure folder exists on VPS
ssh -p $VPS_PORT "$VPS_USER@$VPS_IP" "mkdir -p $TARGET_DIR"
# Upload zip
scp -P $VPS_PORT deploy.zip "${VPS_USER}@${VPS_IP}:${TARGET_DIR}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Uploaded deploy.zip to VPS." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to upload files to VPS. Check SSH connection." -ForegroundColor Red
    exit 1
}

# 6. EXTRACT AND RESTART ON SERVER
Write-Host "`n[6/6] Extracting files and starting services on VPS..." -ForegroundColor Yellow

$SSH_COMMANDS = @"
cd $TARGET_DIR
echo "Extracting release..."
# Ensure unzip is installed
if ! command -v unzip &> /dev/null; then
  echo "Installing unzip on VPS..."
  sudo apt update && sudo apt install unzip -y
fi

unzip -o deploy.zip
rm deploy.zip

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
    echo "Created default backend/.env. Please configure your actual DB and payment keys on the VPS!"
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
"@

ssh -p $VPS_PORT "$VPS_USER@$VPS_IP" $SSH_COMMANDS

Write-Host "`n=====================================================" -ForegroundColor Green
Write-Host "  Deployment Process Completed Successfully!         " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
