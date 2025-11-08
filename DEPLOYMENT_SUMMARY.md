# Deployment Scripts Summary

## Created Files

### 1. `dev.ps1` (Development Deployment Script)

**Purpose:** Local development with HTTP-only configuration

**Features:**

- Checks if Docker is running
- Automatically switches to HTTP configuration (nginx-http-only.conf)
- Creates docker-compose.dev.yml with development settings
- Uses separate containers with `-dev` suffix
- Weak passwords (safe for local dev)
- Volume mounts for hot-reload
- Runs on http://localhost

**Usage:**

```powershell
.\dev.ps1
```

**What it configures:**

- nginx: HTTP only (port 80)
- MongoDB: DevPassword123!
- App: NODE_ENV=development
- URLs: http://localhost
- Volumes: Mounted for live editing

---

### 2. `stop-dev.ps1` (Stop Development)

**Purpose:** Stop local development environment

**Usage:**

```powershell
.\stop-dev.ps1
```

**Features:**

- Stops all dev containers
- Preserves data volumes
- Shows command to remove volumes if needed

---

### 3. `DEPLOYMENT.md` (Complete Deployment Guide)

**Purpose:** Comprehensive documentation for both environments

**Sections:**

- Quick start guides
- Configuration comparisons
- Troubleshooting
- Best practices
- Security notes
- Environment variable references
- Command references

---

## Updated Files

### 1. `deploy.ps1` (Production Deployment Script)

**Changes:**

- Now automatically uses nginx-ssl.conf for HTTPS
- Backs up and restores nginx.conf
- Adds SSL reminder messages
- Clearly labeled as "Production" deployment

**Usage:**

```powershell
.\deploy.ps1
```

**What it does:**

1. Switches to HTTPS configuration (nginx-ssl.conf → nginx.conf)
2. Uploads all files to VPS
3. Provides SSH command for building
4. Restores original nginx.conf

---

## Configuration Files Usage

### Development (Your Computer)

```
dev.ps1 → nginx-http-only.conf → nginx.conf
         → docker-compose.dev.yml (created automatically)
```

### Production (VPS Server)

```
deploy.ps1 → nginx-ssl.conf → nginx.conf
            → docker-compose.yml (uploaded to server)
```

---

## Quick Reference

| Action           | Command                                                  | Environment      |
| ---------------- | -------------------------------------------------------- | ---------------- |
| Start local dev  | `.\dev.ps1`                                              | HTTP (localhost) |
| Stop local dev   | `.\stop-dev.ps1`                                         | -                |
| View dev logs    | `docker compose -f docker-compose.dev.yml logs -f`       | Local            |
| Deploy to server | `.\deploy.ps1`                                           | HTTPS (VPS)      |
| Rebuild dev      | `docker compose -f docker-compose.dev.yml up -d --build` | Local            |

---

## How It Works

### Development Flow

```
1. Run dev.ps1
   ↓
2. Script copies nginx-http-only.conf → nginx.conf
   ↓
3. Script creates docker-compose.dev.yml
   ↓
4. Docker Compose builds and starts containers
   ↓
5. Access at http://localhost
```

### Production Flow

```
1. Run deploy.ps1
   ↓
2. Script copies nginx-ssl.conf → nginx.conf
   ↓
3. Script uploads files to VPS via SCP
   ↓
4. SSH to VPS and run: sudo docker compose up -d --build
   ↓
5. Access at https://health.isy.software
```

---

## Key Differences

### Development (dev.ps1)

- ✅ HTTP only (no SSL)
- ✅ Port 80
- ✅ localhost URLs
- ✅ Weak passwords (OK for local)
- ✅ Volume mounts (hot reload)
- ✅ NODE_ENV=development
- ✅ Separate dev volumes
- ✅ Fast iteration

### Production (deploy.ps1)

- ✅ HTTPS with SSL
- ✅ Ports 80 → 443
- ✅ Domain name (health.isy.software)
- ✅ Strong passwords
- ✅ No volume mounts (immutable)
- ✅ NODE_ENV=production
- ✅ SSL auto-renewal (certbot)
- ✅ Security hardened

---

## First Time Setup

### Local Development

```powershell
# Just run the script - it handles everything!
.\dev.ps1
```

### Production Server

```bash
# On VPS, first time only:
cd /home/adminroot/isy.healthcare
chmod +x setup-ssl.sh
./setup-ssl.sh

# Then from your computer:
.\deploy.ps1
```

---

## Troubleshooting

### "Docker is not running"

**Solution:** Start Docker Desktop and try again

### "Port 80 already in use"

**Solution:**

```powershell
# Find what's using port 80
netstat -ano | findstr :80
# Stop that service or change nginx port
```

### "Cannot access localhost"

**Solution:**

```powershell
# Check container status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f
```

---

## Security Notes

### Development

- ⚠️ Weak passwords are ACCEPTABLE (local only)
- ⚠️ HTTP is ACCEPTABLE (local only)
- ⚠️ Exposed ports are ACCEPTABLE (local only)
- ⚠️ NEVER use dev.ps1 for production

### Production

- ✅ Change all passwords in docker-compose.yml
- ✅ HTTPS enforced with SSL certificates
- ✅ Firewall configured on VPS
- ✅ SSL auto-renewal enabled
- ✅ Secure session management

---

## Testing the Setup

### Test Development Deployment

```powershell
# 1. Start development
.\dev.ps1

# 2. Check it's running
docker compose -f docker-compose.dev.yml ps

# 3. Access the app
# Open browser to http://localhost

# 4. View logs
docker compose -f docker-compose.dev.yml logs -f app

# 5. Stop when done
.\stop-dev.ps1
```

### Test Production Deployment

```powershell
# 1. Deploy files
.\deploy.ps1

# 2. SSH to VPS
ssh -i ~/.ssh/id_rsa adminroot@103.126.116.50

# 3. Build and start
cd /home/adminroot/isy.healthcare
sudo docker compose up -d --build

# 4. Check status
sudo docker compose ps

# 5. View logs
sudo docker compose logs -f

# 6. Access the app
# Open browser to https://health.isy.software
```

---

## Summary

You now have:

- ✅ **dev.ps1** - One-command local deployment with HTTP
- ✅ **stop-dev.ps1** - Easy cleanup
- ✅ **deploy.ps1** - Production deployment with HTTPS
- ✅ **DEPLOYMENT.md** - Complete documentation
- ✅ Automatic nginx configuration switching
- ✅ Separate development and production environments
- ✅ No manual configuration file editing needed

**Just run `.\dev.ps1` to start developing!**
