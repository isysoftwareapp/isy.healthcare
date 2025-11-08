# ISY Healthcare Deployment Guide# Deployment Guide

## 🚀 Quick StartThis guide explains how to deploy the ISY Healthcare application in different environments.

````powershell## Overview

# 1. Check readiness

.\check-deploy.ps1- **`dev.ps1`** - Local development deployment (HTTP only)

- **`deploy.ps1`** - Production deployment to VPS (HTTPS/SSL)

# 2. Deploy to production- **`stop-dev.ps1`** - Stop local development environment

.\deploy.ps1

```## Prerequisites



---### Local Development



## 📋 Available Scripts- Docker Desktop installed and running

- PowerShell 5.1 or higher

### 1. **check-deploy.ps1** - Pre-deployment Validation ✅- At least 4GB RAM available for Docker

Verifies everything before deployment.

### Production Deployment

```powershell

.\check-deploy.ps1- SSH access to VPS

```- SSH key configured (`~/.ssh/id_rsa`)

- Docker and Docker Compose installed on VPS

**Checks:**- Domain name pointed to VPS IP

- ✓ Required directories (app, components, lib, models, types)

- ✓ Optional directories (public, mongo-init)## Local Development Deployment

- ✓ Required files (package.json, Dockerfile, etc.)

- ✓ Common issues (docker-compose version field, etc.)### Quick Start

- ✓ Estimated upload size

1. **Start the development environment:**

---

   ```powershell

### 2. **deploy.ps1** - Full Production Deployment 🚢   .\dev.ps1

````

```powershell

.\deploy.ps12. **Access the application:**

```

- Web: http://localhost

**Features:** - MongoDB: mongodb://admin:DevPassword123!@localhost:27017

- 🔄 **Auto-detects all directories** - No manual updates needed!

- 🔒 SSL configuration automatic3. **Stop the development environment:**

- 📤 Uploads all project files ```powershell

- 🏗️ Builds Docker image on VPS .\stop-dev.ps1

- 🚀 Starts containers immediately ```

- ✅ Error recovery built-in

### What dev.ps1 Does

**What gets uploaded:**

````1. Checks if Docker is running

✅ app/          - Next.js pages and API routes2. Backs up current `nginx.conf`

✅ components/   - React components (NOW INCLUDED!)3. Copies `nginx-http-only.conf` to `nginx.conf` (HTTP configuration)

✅ lib/          - Utilities and helpers4. Creates `docker-compose.dev.yml` with development settings

✅ models/       - Database schemas5. Starts containers with Docker Compose

✅ types/        - TypeScript definitions (NOW INCLUDED!)6. Displays access URLs and helpful commands

✅ public/       - Static assets

✅ mongo-init/   - Database initialization### Development Configuration

✅ Config files  - package.json, tsconfig.json, etc.

```**nginx.conf** (HTTP only):



---- Listens on port 80

- No SSL/HTTPS

### 3. **quick-deploy.ps1** - Fast Incremental Update ⚡- Direct proxy to Next.js app



```powershell**docker-compose.dev.yml**:

.\quick-deploy.ps1

```- Container names with `-dev` suffix

- Development MongoDB password

**Best for:**- `NODE_ENV=development`

- Quick code changes- Local URLs (http://localhost)

- Component updates- Volume mounts for hot-reload

- Development testing- Separate volume for dev data



**Speed:****Environment Variables** (Development):

- With rsync: Only uploads changes (~5-10 seconds)

- Without rsync: Full upload (~30-60 seconds)```env

NODE_ENV=development

---NEXT_PUBLIC_APP_URL=http://localhost

NEXTAUTH_URL=http://localhost

## 🔧 ConfigurationMONGODB_URI=mongodb://admin:DevPassword123!@mongodb:27017/isy_clinic

````

All scripts use these settings:

### Development Workflow

````powershell

VPS IP:      103.126.116.50**View logs:**

VPS User:    adminroot

Remote Dir:  /home/adminroot/isy.healthcare```powershell

SSH Key:     ~/.ssh/id_rsadocker compose -f docker-compose.dev.yml logs -f

````

---**View specific service logs:**

## 📊 Deployment Workflow```powershell

docker compose -f docker-compose.dev.yml logs -f app

### First Time Setupdocker compose -f docker-compose.dev.yml logs -f mongodb

docker compose -f docker-compose.dev.yml logs -f nginx

`powershell`

# Step 1: Verify everything is ready

.\check-deploy.ps1**Restart a service:**

# Step 2: Deploy```powershell

.\deploy.ps1docker compose -f docker-compose.dev.yml restart app

````

# Step 3: Set up SSL on VPS (first time only)

ssh adminroot@103.126.116.50**Rebuild and restart:**

cd /home/adminroot/isy.healthcare

chmod +x setup-ssl.sh```powershell

sudo ./setup-ssl.sh health.isy.software your-email@example.comdocker compose -f docker-compose.dev.yml up -d --build

````

### Regular Updates**Stop and remove all containers:**

`powershell`powershell

# For small changes (faster)docker compose -f docker-compose.dev.yml down

.\quick-deploy.ps1```

# For major changes or new directories**Stop and remove volumes (WARNING: deletes all data):**

.\deploy.ps1

````powershell

docker compose -f docker-compose.dev.yml down -v

---```



## 🎯 What's New### Accessing MongoDB (Development)



### ✨ Automatic Directory Detection**Connection String:**

The deploy script now **automatically finds and uploads ALL directories**!

```

**Before (manual):**mongodb://admin:DevPassword123!@localhost:27017/isy_clinic?authSource=admin

```powershell```

scp -r app/* ...

scp -r lib/* ...**Using MongoDB Compass:**

scp -r models/* ...

# Forgot components! ❌1. Open MongoDB Compass

# Forgot types! ❌2. Use connection string above

```3. Browse collections and data



**Now (automatic):****Using Docker exec:**

```powershell

# Script scans for: app, components, lib, models, types, public, mongo-init```powershell

# Uploads everything automatically! ✅docker exec -it isy-healthcare-mongodb-dev mongosh -u admin -p DevPassword123! --authenticationDatabase admin

````

### 🔍 Pre-deployment Checks## Production Deployment

New `check-deploy.ps1` catches issues before upload:

- Missing directories### Setup (First Time Only)

- Missing files

- Configuration problems1. **Configure VPS settings in `deploy.ps1`:**

- Size estimation

  ```powershell

  ```

### ⚡ Quick Deploy Option $VPS_IP = "103.126.116.50"

New `quick-deploy.ps1` for rapid development: $VPS_USER = "adminroot"

- Only uploads changed files (with rsync) $APP_DIR = "/home/adminroot/isy.healthcare"

- Rebuilds automatically ```

- Much faster for iterations

2. **Ensure SSH key exists:**

---

````powershell

## 🐛 Troubleshooting   # Check if key exists

Test-Path "$env:USERPROFILE\.ssh\id_rsa"

### Build Error: "Module not found: Can't resolve '@/components/...'"   ```



**Cause:** Components directory wasn't uploaded (old script issue)3. **Setup SSL certificates on VPS (first deployment):**

```bash

**Fix:** ✅ **ALREADY FIXED** in new deploy.ps1!   # On VPS

cd /home/adminroot/isy.healthcare

```powershell   chmod +x setup-ssl.sh

# Just deploy again with new script   ./setup-ssl.sh

.\deploy.ps1   ```

````

### Deploy to Production

The new script automatically includes:

- ✅ `components/` directory```powershell

- ✅ `types/` directory.\deploy.ps1

- ✅ All other directories```

---### What deploy.ps1 Does

### Warning: "version is obsolete"1. Backs up current `nginx.conf`

2. Copies `nginx-ssl.conf` to `nginx.conf` (HTTPS configuration)

**Status:** ✅ **ALREADY FIXED** in docker-compose.yml!3. Uploads all files to VPS via SCP:

- Configuration files

The `version: "3.8"` line has been removed. - Application code (app, lib, models, components)

- Public assets

--- - Docker configuration

4. Provides SSH command to build and start on VPS

### Slow Upload Speed5. Restores nginx.conf backup

**Solution:** Install rsync### Production Configuration

````powershell**nginx.conf** (HTTPS/SSL):

# Windows with Chocolatey

choco install rsync- HTTP (port 80) → redirects to HTTPS

- HTTPS (port 443) with SSL certificates

# Or use WSL- Let's Encrypt certificate paths

wsl --install- Certbot challenge support

# Then in WSL: sudo apt install rsync

```**docker-compose.yml**:



Then use `.\quick-deploy.ps1` for faster uploads.- Production MongoDB password

- `NODE_ENV=production`

---- HTTPS URLs (https://health.isy.software)

- No volume mounts (immutable containers)

### SSH Connection Failed- Certbot for SSL renewal



```powershell**Environment Variables** (Production):

# Test connection

ssh -i ~/.ssh/id_rsa adminroot@103.126.116.50```env

NODE_ENV=production

# If fails, check keyNEXT_PUBLIC_APP_URL=https://health.isy.software

ls ~/.ssh/id_rsaNEXTAUTH_URL=https://health.isy.software

MONGODB_URI=mongodb://admin:SecurePassword123!@mongodb:27017/isy_clinic

# Regenerate if needed```

ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa

ssh-copy-id -i ~/.ssh/id_rsa adminroot@103.126.116.50### Building on VPS

````

After running `deploy.ps1`, connect to VPS and build:

---

````bash

## 📺 Viewing Logsssh -i ~/.ssh/id_rsa adminroot@103.126.116.50

cd /home/adminroot/isy.healthcare

### Application Logssudo docker compose down

```bashsudo docker compose up -d --build

ssh adminroot@103.126.116.50 "cd /home/adminroot/isy.healthcare && sudo docker compose logs -f app"```

````

### Monitoring Production

### All Containers

```````bash**View logs:**

ssh adminroot@103.126.116.50 "cd /home/adminroot/isy.healthcare && sudo docker compose logs -f"

``````bash

sudo docker compose logs -f

### Specific Container```

```bash

# MongoDB**Check container status:**

ssh adminroot@103.126.116.50 "cd /home/adminroot/isy.healthcare && sudo docker compose logs -f mongodb"

```bash

# Nginxsudo docker compose ps

ssh adminroot@103.126.116.50 "cd /home/adminroot/isy.healthcare && sudo docker compose logs -f nginx"```

```````

**Restart service:**

---

```bash

## 🔄 Quick Referencesudo docker compose restart app

```

| Task | Command |

|------|---------|## Configuration Files

| **Check before deploy** | `.\check-deploy.ps1` |

| **Full deployment** | `.\deploy.ps1` |### nginx-http-only.conf

| **Quick update** | `.\quick-deploy.ps1` |

| **View app logs** | `ssh adminroot@VPS 'docker compose logs -f app'` |- **Purpose:** Development (local computer)

| **Restart app** | `ssh adminroot@VPS 'docker compose restart app'` |- **Protocol:** HTTP only

| **Stop all** | `ssh adminroot@VPS 'docker compose down'` |- **Port:** 80

| **Start all** | `ssh adminroot@VPS 'docker compose up -d'` |- **Use Case:** Local testing without SSL

| **Rebuild** | `ssh adminroot@VPS 'docker compose up -d --build'` |

### nginx-ssl.conf

---

- **Purpose:** Production (VPS server)

## 🎓 Best Practices- **Protocol:** HTTP → HTTPS redirect

- **Ports:** 80 (redirect), 443 (SSL)

### 1. Always Check First- **Certificates:** Let's Encrypt

````powershell- **Use Case:** Production deployment with SSL

.\check-deploy.ps1 && .\deploy.ps1

```### docker-compose.yml



### 2. Use Quick Deploy for Small Changes- **Purpose:** Production deployment

```powershell- **Features:**

# Changed a component? Use quick deploy  - Production passwords

.\quick-deploy.ps1  - HTTPS URLs

```  - SSL certificate volumes

  - Certbot for auto-renewal

### 3. Use Full Deploy for Structure Changes  - No hot-reload volumes

```powershell

# Added new directories? Use full deploy### docker-compose.dev.yml

.\deploy.ps1

```- **Purpose:** Local development

- **Features:**

### 4. Monitor After Deployment  - Development passwords

```bash  - HTTP URLs

# Watch logs in real-time  - Volume mounts for hot-reload

ssh adminroot@VPS 'docker compose logs -f app'  - Separate dev volumes

```  - No SSL/Certbot



### 5. Test Locally First## Troubleshooting

```powershell

# Test in local Docker environment### Development Issues

.\dev.ps1

**Docker not running:**

# Then deploy to production

.\deploy.ps1```powershell

```# Start Docker Desktop manually

# Then run dev.ps1 again

---```



## 🔐 Security Notes**Port 80 already in use:**



- ✅ SSH key authentication (no passwords)```powershell

- ✅ .env.local never uploaded (in .dockerignore)# Check what's using port 80

- ✅ SSL/HTTPS in productionnetstat -ano | findstr :80

- ✅ MongoDB credentials in docker-compose.yml

- ✅ Separate dev/prod configurations# Stop conflicting service or change nginx port

````

---

**Cannot access http://localhost:**

## 📦 What Gets Deployed

````powershell

### Always Uploaded:# Check if containers are running

```docker compose -f docker-compose.dev.yml ps

app/                    # Next.js application

├── api/               # API routes# Check nginx logs

├── dashboard/         # Dashboard pagesdocker compose -f docker-compose.dev.yml logs nginx

├── login/             # Auth pages

└── pricelists/        # Pricelist page# Check app logs

docker compose -f docker-compose.dev.yml logs app

components/            # React components```

├── DashboardLayout.tsx

├── GlobalSearch.tsx**MongoDB connection failed:**

├── AllergyManager.tsx

├── PrescriptionForm.tsx```powershell

└── ... (all others)# Verify MongoDB is running

docker compose -f docker-compose.dev.yml ps mongodb

lib/                   # Utilities

├── mongodb.ts# Check MongoDB logs

└── ... (helpers)docker compose -f docker-compose.dev.yml logs mongodb



models/                # Database models# Restart MongoDB

├── User.tsdocker compose -f docker-compose.dev.yml restart mongodb

├── Patient.ts```

├── Service.ts

└── ... (all models)### Production Issues



types/                 # TypeScript types**SSH connection failed:**

└── next-auth.d.ts

```powershell

Configuration:# Test SSH connection

├── package.jsonssh -i "$env:USERPROFILE\.ssh\id_rsa" adminroot@103.126.116.50

├── package-lock.json

├── next.config.ts# Check SSH key permissions

├── tsconfig.jsonicacls "$env:USERPROFILE\.ssh\id_rsa"

├── Dockerfile```

├── docker-compose.yml

└── middleware.ts**File upload failed:**

````

````powershell

### Optionally Uploaded (if exists):# Check SCP connectivity

```scp -i "$env:USERPROFILE\.ssh\id_rsa" README.md adminroot@103.126.116.50:/tmp/

public/                # Static assets

mongo-init/            # DB initialization# Verify VPS directory exists

```ssh -i "$env:USERPROFILE\.ssh\id_rsa" adminroot@103.126.116.50 "ls -la /home/adminroot/isy.healthcare"

````

### Never Uploaded (in .dockerignore):

````**SSL certificate errors:**

node_modules/

.next/```bash

.env.local# On VPS - Check certificate status

.git/sudo certbot certificates

.vscode/

*.log# Renew certificate manually

```sudo certbot renew



---# Check nginx configuration

sudo docker compose exec nginx nginx -t

## 💡 Tips

# View nginx logs

### Faster Deploymentssudo docker compose logs nginx

1. Use `quick-deploy.ps1` for component changes```

2. Install rsync for incremental uploads

3. Use full deploy only when needed**Application won't start on VPS:**



### Debugging Build Failures```bash

1. Check `check-deploy.ps1` output first# Check all containers

2. Review PowerShell error messagessudo docker compose ps

3. Check VPS logs: `docker compose logs -f app`

4. Verify all files uploaded: `ssh adminroot@VPS 'ls -la /home/adminroot/isy.healthcare'`# View all logs

sudo docker compose logs

### Managing Environment Variables

```bash# Rebuild specific service

# Production vars are in docker-compose.ymlsudo docker compose up -d --build app

# Local vars in .env.local (not uploaded)

# Check disk space

# To update production vars:df -h

# 1. Edit docker-compose.yml locally```

# 2. Run deploy.ps1

# 3. Restart: ssh adminroot@VPS 'docker compose restart app'## Environment Comparison

````

| Feature | Development (dev.ps1) | Production (deploy.ps1) |

---| ---------------- | --------------------- | ----------------------- |

| Protocol | HTTP | HTTPS |

## 🆘 Common Issues & Solutions| Port | 80 | 80 → 443 |

| SSL | No | Yes (Let's Encrypt) |

| Issue | Solution || Domain | localhost | health.isy.software |

|-------|----------|| MongoDB Password | DevPassword123! | SecurePassword123! |

| Missing components error | ✅ Fixed! Use new deploy.ps1 || Hot Reload | Yes (volume mounts) | No |

| Version obsolete warning | ✅ Fixed! Updated docker-compose.yml || NODE_ENV | development | production |

| Slow uploads | Install rsync, use quick-deploy.ps1 || Container Names | \*-dev suffix | Production names |

| SSH fails | Check key at ~/.ssh/id_rsa || Volumes | Separate dev volumes | Production volumes |

| Build fails | Run check-deploy.ps1 first || Certbot | No | Yes |

| App won't start | Check logs: `docker compose logs -f app` |

## Security Notes

---

### Development

## 📞 Support

- ⚠️ **NOT for production use**

1. **Pre-deployment issues:** Run `.\check-deploy.ps1`- Weak passwords (acceptable for local dev)

2. **Upload issues:** Check SSH connection and key- No encryption (HTTP only)

3. **Build issues:** Review error messages in PowerShell output- Ports exposed to host

4. **Runtime issues:** Check logs with `docker compose logs -f app`- Volume mounts enabled

---### Production

**Version:** 2.0 - Auto-detection Enabled - ✅ **Production-ready**

**Last Updated:** November 7, 2025 - Strong passwords (change in docker-compose.yml)

**Breaking Changes:** None - fully backward compatible- HTTPS encryption (SSL/TLS)

- Reverse proxy (nginx)
- Immutable containers
- Auto SSL renewal (certbot)

## Best Practices

### Development

1. Use `dev.ps1` for all local testing
2. Never commit `.env` files
3. Update passwords in `docker-compose.dev.yml` if needed
4. Use `stop-dev.ps1` when done to free resources
5. Periodically clean up volumes: `docker compose -f docker-compose.dev.yml down -v`

### Production

1. Always test locally with `dev.ps1` first
2. Update production passwords in `docker-compose.yml`
3. Keep SSL certificates up to date
4. Monitor logs regularly
5. Backup MongoDB data before updates
6. Use environment variables for secrets (not hardcoded)

## Quick Reference

### Start Development

```powershell
.\dev.ps1
```

### Stop Development

```powershell
.\stop-dev.ps1
```

### Deploy to Production

```powershell
.\deploy.ps1
# Then SSH to VPS and run:
# sudo docker compose up -d --build
```

### View Development Logs

```powershell
docker compose -f docker-compose.dev.yml logs -f
```

### Access Development MongoDB

```
mongodb://admin:DevPassword123!@localhost:27017/isy_clinic?authSource=admin
```

### Rebuild Development

```powershell
docker compose -f docker-compose.dev.yml up -d --build
```

### Clean Development Environment

```powershell
docker compose -f docker-compose.dev.yml down -v
```

## Support

For issues or questions:

1. Check logs: `docker compose logs`
2. Verify configuration files
3. Review this deployment guide
4. Check Docker/nginx documentation
