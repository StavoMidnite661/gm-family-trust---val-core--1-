# push_to_hub.ps1
$DOCKER_USER = "stavomidnite661"
$IMAGE_NAME = "val-core-backend"
$TAG = "latest"

Write-Host "🚀 Starting SOVR Build Process..." -ForegroundColor Cyan

# 1. Build the image locally
Write-Host "📦 Building Docker image: ${DOCKER_USER}/${IMAGE_NAME}:${TAG}" -ForegroundColor Yellow
docker build -t "${DOCKER_USER}/${IMAGE_NAME}:${TAG}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit
}

# 2. Push to Docker Hub
Write-Host "📤 Pushing to Docker Hub..." -ForegroundColor Yellow
docker push "${DOCKER_USER}/${IMAGE_NAME}:${TAG}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed! Are you logged in? (Run 'docker login')" -ForegroundColor Red
    exit
}

Write-Host "✅ Successfully pushed to stavomidnite661/val-core-backend" -ForegroundColor Green
Write-Host "Now go to your VPS and run: docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Cyan
