@echo off
title Deploy to Vercel via GitHub
cls
echo ===================================================
echo   AUTO-DEPLOYMENT SCRIPT FOR LOVABLE UPDATES
echo   Project: swift-class-hub
echo ===================================================
echo.

echo [+] Checking Git status...
git status
echo.

echo [+] Staging all changes (git add .)...
git add .

echo [+] Committing changes...
git commit -m "deploy: sync updates from lovable"

echo [+] Pushing to GitHub (git push)...
git push

echo.
echo ===================================================
echo   [SUCCESS] Code successfully pushed to GitHub!
echo   Vercel will now automatically build and deploy.
echo   Check your build status at:
echo   https://vercel.com/thanh-nguyens-projects-0a469ae/stepsprototype
echo ===================================================
echo.
pause
