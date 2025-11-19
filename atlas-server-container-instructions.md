# Waukesha Makers Atlas - Server Container Deployment Instructions

This guide covers deploying the Next.js application for the Waukesha Makers Atlas using Docker.

## Prerequisites

- Docker installed on your deployment server
- Docker Compose installed (version 2.0 or higher recommended)
- Database container deployed and running (see `atlas-db-container-instructions.md`)
- WildApricot OAuth credentials configured
- Node.js and npm installed locally for initial setup

## Directory Structure

Your application should be in a directory like:

```bash
cd ~/waukesha-makers-atlas
```

## Step 1: Create Dockerfile

Create a `Dockerfile` in your application root:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set proper permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

## Step 2: Update next.config.ts

Add the standalone output configuration to `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // ... rest of your config
};

export default nextConfig;
```

## Step 3: Create Health Check Endpoint

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

## Step 4: Create Docker Compose Configuration

Create a `docker-compose.yml` file (or update the existing one):

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: waukesha-atlas-app
    restart: unless-stopped

    environment:
      # Database Configuration
      DATABASE_URL: mysql://${DB_USER}:${DB_PASSWORD}@waukesha-atlas-db:3306/${DB_NAME}

      # NextAuth Configuration
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}

      # WildApricot OAuth Configuration
      WILDAPRICOT_CLIENT_ID: ${WILDAPRICOT_CLIENT_ID}
      WILDAPRICOT_CLIENT_SECRET: ${WILDAPRICOT_CLIENT_SECRET}
      WILDAPRICOT_ORGANIZATION_ID: ${WILDAPRICOT_ORGANIZATION_ID}

      # Node Environment
      NODE_ENV: production

    ports:
      - "3000:3000"

    networks:
      - waukesha-atlas-network

    depends_on:
      - db

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: mysql:8.0
    container_name: waukesha-atlas-db
    restart: unless-stopped

    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}

    ports:
      - "127.0.0.1:3306:3306"

    volumes:
      - mysql_data:/var/lib/mysql

    networks:
      - waukesha-atlas-network

    command: --default-authentication-plugin=mysql_native_password

    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
    driver: local

networks:
  waukesha-atlas-network:
    name: waukesha-atlas-network
    driver: bridge
```

## Step 5: Create Environment Variables File

Create a `.env` file in your application root:

```bash
# Database Configuration
DB_NAME=waukesha_atlas
DB_USER=atlas_user
DB_PASSWORD=your_secure_user_password_here
MYSQL_ROOT_PASSWORD=your_secure_root_password_here

# Database URL (used by application)
DATABASE_URL=mysql://atlas_user:your_secure_user_password_here@waukesha-atlas-db:3306/waukesha_atlas

# NextAuth Configuration
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://your-server-ip:3000

# WildApricot OAuth Configuration
WILDAPRICOT_CLIENT_ID=your_wildapricot_client_id
WILDAPRICOT_CLIENT_SECRET=your_wildapricot_client_secret
WILDAPRICOT_ORGANIZATION_ID=your_wildapricot_org_id
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### Update NEXTAUTH_URL

Replace `your-server-ip` with your actual server's IP address or domain name:
- For local network: `http://192.168.1.100:3000`
- For domain: `https://atlas.yourdomain.com`

**Important Security Notes:**
- Never commit `.env` to version control
- Use strong, unique passwords
- Keep secrets secure and rotate them periodically
- Add `.env` to `.gitignore`

## Step 6: Set Proper Permissions

```bash
chmod 600 .env
```

## Step 7: Create .dockerignore File

Create `.dockerignore` to exclude unnecessary files:

```
.git
.gitignore
.next
.env
.env.*
node_modules
npm-debug.log
README.md
docker-compose.yml
Dockerfile
.dockerignore
*.md
.vscode
.idea
```

## Step 8: Build and Start Containers

### Build the Application Image

```bash
docker-compose build app
```

This will:
- Install dependencies
- Build the Next.js application
- Create an optimized production image

### Start All Services

```bash
docker-compose up -d
```

This will start both the database and application containers.

## Step 9: Run Database Migrations

After the containers are running, run migrations:

```bash
# From your local machine with the application code
export DATABASE_URL="mysql://atlas_user:your_password@your-server-ip:3306/waukesha_atlas"
npm run db:push
```

Or run migrations from inside the container:

```bash
docker exec -it waukesha-atlas-app sh
# Inside container:
npm run db:push
exit
```

## Step 10: (Optional) Seed Initial Data

```bash
docker exec -it waukesha-atlas-app sh
npm run db:seed
exit
```

## Step 11: Verify Deployment

### Check Container Status

```bash
docker-compose ps
```

Both containers should show status "Up" and "healthy".

### View Application Logs

```bash
docker-compose logs -f app
```

### Test the Application

Open your browser and navigate to:
- `http://your-server-ip:3000`

You should see the Waukesha Makers Atlas homepage.

### Test Health Endpoint

```bash
curl http://your-server-ip:3000/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Network Configuration

### Internal Communication

The application connects to the database using the internal Docker network:
- Database hostname: `waukesha-atlas-db`
- Database port: `3306` (internal)
- Network: `waukesha-atlas-network`

### External Access

The application is exposed on port `3000` of the host machine.

For production with SSL/TLS, use a reverse proxy (see Reverse Proxy section below).

## Updating the Application

### Update Application Code

```bash
# Pull latest code
git pull

# Rebuild container
docker-compose build app

# Restart with new image
docker-compose up -d app
```

### Apply Database Migrations

```bash
docker exec -it waukesha-atlas-app sh
npm run db:push
exit
```

## Production Deployment with Reverse Proxy (Recommended)

For production, use Nginx or Traefik as a reverse proxy with SSL/TLS.

### Example Nginx Configuration

Install Nginx on the host:

```bash
sudo apt update
sudo apt install nginx
```

Create `/etc/nginx/sites-available/waukesha-atlas`:

```nginx
server {
    listen 80;
    server_name atlas.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/waukesha-atlas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Add SSL/TLS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d atlas.yourdomain.com
```

Update `NEXTAUTH_URL` in `.env`:

```bash
NEXTAUTH_URL=https://atlas.yourdomain.com
```

Restart the application:

```bash
docker-compose restart app
```

## Monitoring and Maintenance

### View Logs

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# All logs
docker-compose logs -f
```

### Monitor Resource Usage

```bash
docker stats waukesha-atlas-app waukesha-atlas-db
```

### Restart Services

```bash
# Restart application only
docker-compose restart app

# Restart all services
docker-compose restart
```

### Stop Services

```bash
docker-compose down
```

### Update Docker Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

## Backup and Restore

### Backup Application Data

The main data to backup is the database (see `atlas-db-container-instructions.md`).

For application files:

```bash
# Backup uploaded files if you add file upload functionality
docker cp waukesha-atlas-app:/app/public/uploads ./backup-uploads
```

### Backup Environment Configuration

```bash
cp .env .env.backup
```

## Troubleshooting

### Container Won't Start

1. Check logs:
   ```bash
   docker-compose logs app
   ```

2. Verify environment variables:
   ```bash
   docker exec waukesha-atlas-app env
   ```

3. Check if port 3000 is in use:
   ```bash
   sudo netstat -tulpn | grep 3000
   ```

### Database Connection Errors

1. Verify database container is running:
   ```bash
   docker-compose ps db
   ```

2. Test database connection from app container:
   ```bash
   docker exec -it waukesha-atlas-app sh
   apk add mysql-client
   mysql -h waukesha-atlas-db -u atlas_user -p
   ```

3. Check DATABASE_URL format:
   ```
   mysql://username:password@hostname:port/database
   ```

### Authentication Issues

1. Verify WildApricot credentials in `.env`
2. Check NEXTAUTH_URL matches your deployment URL
3. Verify NEXTAUTH_SECRET is set
4. Check WildApricot OAuth redirect URI matches NEXTAUTH_URL

### Build Failures

1. Clear build cache:
   ```bash
   docker-compose build --no-cache app
   ```

2. Check Dockerfile syntax
3. Verify package.json has correct scripts
4. Check for missing dependencies

### Application Crashes

1. Check logs for error messages:
   ```bash
   docker-compose logs --tail=100 app
   ```

2. Verify sufficient memory:
   ```bash
   docker stats waukesha-atlas-app
   ```

3. Increase memory limit in docker-compose.yml:
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
   ```

### Slow Performance

1. Enable production optimizations in Next.js
2. Add Redis for session storage
3. Configure CDN for static assets
4. Optimize database queries
5. Add database indexes

## Security Best Practices

1. **Use HTTPS** - Set up SSL/TLS with Let's Encrypt
2. **Secure environment variables** - Never commit `.env` to git
3. **Regular updates** - Keep Docker images and dependencies updated
4. **Restrict database access** - Bind MySQL to localhost only
5. **Use strong secrets** - Generate with `openssl rand -base64 32`
6. **Enable firewall** - Only allow necessary ports (80, 443, 22)
7. **Regular backups** - Automate database backups
8. **Monitor logs** - Watch for suspicious activity
9. **Limit container privileges** - Run as non-root user
10. **Network isolation** - Use Docker networks to isolate services

## Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Or allow direct access to Next.js (development only)
sudo ufw allow 3000/tcp

# Check status
sudo ufw status
```

## Performance Optimization

### Enable Caching

Add to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,

  images: {
    unoptimized: false,
    remotePatterns: [],
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Optimize fonts
  optimizeFonts: true,
};
```

### Database Connection Pooling

Update your database configuration to use connection pooling for better performance with multiple concurrent users.

## Scaling for Production

### Horizontal Scaling

Use Docker Swarm or Kubernetes for multi-node deployment:

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml waukesha-atlas
```

### Load Balancing

Add Nginx or HAProxy for load balancing across multiple app containers.

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review logs for errors
2. **Weekly**: Check disk space usage
3. **Monthly**: Update Docker images
4. **Monthly**: Review and rotate secrets
5. **Quarterly**: Review and optimize database
6. **Quarterly**: Security audit

### Monitoring Checklist

- [ ] Application responding to health checks
- [ ] Database connection healthy
- [ ] Disk space sufficient (>20% free)
- [ ] Memory usage normal (<80%)
- [ ] No error spikes in logs
- [ ] Backups completing successfully

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [MySQL Docker Documentation](https://hub.docker.com/_/mysql)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Quick Reference Commands

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart application
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build app

# Stop all services
docker-compose down

# Remove everything including volumes (⚠️ destructive)
docker-compose down -v

# Execute command in container
docker exec -it waukesha-atlas-app sh

# View resource usage
docker stats

# Clean up unused images
docker image prune -a
```

## Getting Help

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify environment variables are correct
3. Test database connectivity
4. Check network configuration
5. Review health check endpoints
6. Consult Docker and Next.js documentation
