#!/bin/bash

# CoachManager System Status Check
# Modern Education Management Platform

echo "🎓 CoachManager System Status Report"
echo "===================================="
echo "Generated: $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in CoachManager directory. Please run from project root."
    exit 1
fi

# System Information
echo "📋 System Information:"
echo "----------------------"
echo "OS: $(uname -s)"
echo "Architecture: $(uname -m)"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
echo ""

# Project Structure Check
echo "📁 Project Structure:"
echo "---------------------"
echo "✅ Root directory: $(pwd)"
echo "✅ Client directory: $([ -d "client" ] && echo "Present" || echo "❌ Missing")"
echo "✅ Server directory: $([ -d "server" ] && echo "Present" || echo "❌ Missing")"
echo "✅ Shared directory: $([ -d "shared" ] && echo "Present" || echo "❌ Missing")"
echo "✅ Deployment directory: $([ -d "deployment" ] && echo "Present" || echo "❌ Missing")"
echo ""

# Dependencies Check
echo "📦 Dependencies Status:"
echo "-----------------------"
if [ -f "package.json" ]; then
    echo "✅ Root package.json: Present"
    if [ -d "node_modules" ]; then
        echo "✅ Root dependencies: Installed"
    else
        echo "⚠️  Root dependencies: Not installed (run: npm install)"
    fi
fi

if [ -f "client/package.json" ]; then
    echo "✅ Client package.json: Present"
    if [ -d "client/node_modules" ]; then
        echo "✅ Client dependencies: Installed"
    else
        echo "⚠️  Client dependencies: Not installed (run: cd client && npm install)"
    fi
fi

if [ -f "server/package.json" ]; then
    echo "✅ Server package.json: Present"
    if [ -d "server/node_modules" ]; then
        echo "✅ Server dependencies: Installed"
    else
        echo "⚠️  Server dependencies: Not installed (run: cd server && npm install)"
    fi
fi
echo ""

# Configuration Files
echo "⚙️  Configuration Files:"
echo "------------------------"
config_files=(
    ".env:Environment variables"
    "drizzle.config.ts:Database configuration" 
    "docker-compose.yml:Docker setup"
    "ecosystem.config.js:PM2 configuration"
    "vite.config.ts:Vite build configuration"
    "tailwind.config.ts:Tailwind CSS configuration"
    "tsconfig.json:TypeScript configuration"
)

for file_desc in "${config_files[@]}"; do
    file="${file_desc%%:*}"
    desc="${file_desc#*:}"
    if [ -f "$file" ]; then
        echo "✅ $file: Present ($desc)"
    else
        echo "⚠️  $file: Missing ($desc)"
    fi
done
echo ""

# Modern Features Check
echo "🚀 Modern Features Status:"
echo "--------------------------"

# Check for three-state attendance in schema
if grep -q "present.*excused.*absent" shared/schema.ts 2>/dev/null; then
    echo "✅ Three-state attendance system: Implemented"
else
    echo "❌ Three-state attendance system: Not found"
fi

# Check for modern subjects
if grep -q "science.*general_math.*higher_math" shared/schema.ts 2>/dev/null; then
    echo "✅ Modern subject system (Science/Math): Implemented"
else
    echo "❌ Modern subject system: Not found"
fi

# Check for purple theme
if grep -q "purple" client/src/index.css 2>/dev/null; then
    echo "✅ Modern purple theme: Implemented"
else
    echo "❌ Modern purple theme: Not found"
fi

# Check for enhanced attendance management
if [ -f "client/src/components/EnhancedAttendanceManagement.tsx" ]; then
    echo "✅ Enhanced attendance management: Present"
else
    echo "❌ Enhanced attendance management: Missing"
fi

# Check for automated results
if [ -f "server/automatedMonthlyResults.ts" ]; then
    echo "✅ Automated monthly results: Present"
else
    echo "❌ Automated monthly results: Missing"
fi
echo ""

# Database Status
echo "🗄️  Database Configuration:"
echo "---------------------------"
if [ -f ".env" ]; then
    if grep -q "DATABASE_URL" .env; then
        echo "✅ Database URL: Configured"
    else
        echo "⚠️  Database URL: Not configured"
    fi
else
    echo "⚠️  Environment file: Missing"
fi

if [ -f "coachdb_2025-09-08.sql" ]; then
    echo "✅ Database dump: Present (coachdb_2025-09-08.sql)"
else
    echo "⚠️  Database dump: Not found"
fi
echo ""

# Build Status
echo "🔨 Build Status:"
echo "----------------"
if [ -d "client/dist" ]; then
    echo "✅ Client build: Present"
    echo "   - Build size: $(du -sh client/dist 2>/dev/null | cut -f1 || echo 'Unknown')"
else
    echo "⚠️  Client build: Not found (run: cd client && npm run build)"
fi
echo ""

# Deployment Readiness
echo "🚀 Deployment Readiness:"
echo "------------------------"
deployment_score=0

# Check essential files
essential_files=(
    "deployment/deploy-production.sh"
    "deployment/.env.production" 
    "deployment/VPS-DEPLOYMENT-GUIDE.md"
    "docker-compose.yml"
    "ecosystem.config.js"
)

for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file: Ready"
        ((deployment_score++))
    else
        echo "❌ $file: Missing"
    fi
done

echo ""
echo "📊 Deployment Score: $deployment_score/${#essential_files[@]}"

if [ $deployment_score -eq ${#essential_files[@]} ]; then
    echo "🎉 System is ready for VPS deployment!"
elif [ $deployment_score -gt $((${#essential_files[@]} / 2)) ]; then
    echo "⚠️  System is mostly ready, but some files are missing."
else
    echo "❌ System needs more preparation before deployment."
fi
echo ""

# Quick Actions
echo "🔧 Quick Actions:"
echo "-----------------"
echo "1. Install all dependencies:"
echo "   npm install && cd client && npm install && cd ../server && npm install && cd .."
echo ""
echo "2. Build frontend:"
echo "   cd client && npm run build && cd .."
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Deploy to VPS:"
echo "   bash deployment/deploy-production.sh"
echo ""
echo "5. Check system health (after deployment):"
echo "   bash deployment/check-status.sh"
echo ""

# File Counts
echo "📈 Project Statistics:"
echo "----------------------"
echo "TypeScript files: $(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l)"
echo "Component files: $(find client/src/components -name "*.tsx" 2>/dev/null | wc -l)"
echo "Page files: $(find client/src/pages -name "*.tsx" 2>/dev/null | wc -l)"
echo "Server files: $(find server -name "*.ts" 2>/dev/null | wc -l)"
echo ""

echo "✨ CoachManager System Status Check Complete!"
echo "============================================="