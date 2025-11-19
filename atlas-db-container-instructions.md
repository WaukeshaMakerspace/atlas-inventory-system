# Waukesha Makers Atlas - Database Container Deployment Instructions

This guide covers deploying the MySQL database for the Waukesha Makers Atlas application using Docker.

## Prerequisites

- Docker installed on your deployment server
- Docker Compose installed (version 2.0 or higher recommended)
- Network access between database and application containers
- At least 2GB of available disk space for the database

## Directory Structure

Create a directory for your database deployment:

```bash
mkdir -p ~/waukesha-atlas-db
cd ~/waukesha-atlas-db
```

## Step 1: Create Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: waukesha-atlas-db
    restart: unless-stopped

    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}

    ports:
      - "3306:3306"

    volumes:
      - mysql_data:/var/lib/mysql
      - ./init:/docker-entrypoint-initdb.d

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

## Step 2: Create Environment Variables File

Create a `.env` file in the same directory:

```bash
# MySQL Root Password (change this to a strong password)
MYSQL_ROOT_PASSWORD=your_secure_root_password_here

# Database Name
MYSQL_DATABASE=waukesha_atlas

# Application Database User
MYSQL_USER=atlas_user

# Application Database Password (change this to a strong password)
MYSQL_PASSWORD=your_secure_user_password_here
```

**Important Security Notes:**
- Replace `your_secure_root_password_here` with a strong password
- Replace `your_secure_user_password_here` with a strong password
- Keep this `.env` file secure and never commit it to version control
- Add `.env` to your `.gitignore` file

## Step 3: Set Proper Permissions

```bash
chmod 600 .env
```

## Step 4: Start the Database Container

```bash
docker-compose up -d
```

This will:
- Pull the MySQL 8.0 image if not already present
- Create and start the container
- Create the database and user
- Set up persistent storage

## Step 5: Verify Container is Running

```bash
docker-compose ps
```

You should see the container with status "Up" and healthy.

Check logs:
```bash
docker-compose logs -f
```

Press `Ctrl+C` to exit log viewing.

## Step 6: Database Initialization

The database schema will be automatically created when you run migrations from the Next.js application. However, you can also run migrations manually:

### Option A: Run Migrations from Host (Recommended)

From your application directory on the same server:

```bash
# Navigate to your application directory
cd /path/to/waukesha-makers-atlas

# Set the database URL
export DATABASE_URL="mysql://atlas_user:your_secure_user_password_here@localhost:3306/waukesha_atlas"

# Run migrations
npm run db:push
```

### Option B: Run Migrations from Another Machine

If running migrations from a different machine, use the server's IP address:

```bash
export DATABASE_URL="mysql://atlas_user:your_secure_user_password_here@your-server-ip:3306/waukesha_atlas"
npm run db:push
```

## Step 7: (Optional) Seed Initial Data

If you want to populate the database with initial data:

```bash
npm run db:seed
```

## Network Configuration

### Internal Container Network

The database is accessible to other containers on the `waukesha-atlas-network` network using the hostname `waukesha-atlas-db`.

Connection string for other containers:
```
mysql://atlas_user:password@waukesha-atlas-db:3306/waukesha_atlas
```

### External Access

The database is exposed on port `3306` of the host machine. To restrict external access, modify the `ports` section in `docker-compose.yml`:

```yaml
# Only allow localhost connections (more secure)
ports:
  - "127.0.0.1:3306:3306"
```

## Backup and Restore

### Creating a Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup
docker exec waukesha-atlas-db mysqldump \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  waukesha_atlas > ~/backups/waukesha-atlas-$(date +%Y%m%d-%H%M%S).sql
```

### Restoring from Backup

```bash
# Restore from backup file
docker exec -i waukesha-atlas-db mysql \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  waukesha_atlas < ~/backups/waukesha-atlas-YYYYMMDD-HHMMSS.sql
```

### Automated Backups

Create a backup script at `~/backup-atlas-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR=~/backups/waukesha-atlas
mkdir -p $BACKUP_DIR

# Keep last 7 days of backups
docker exec waukesha-atlas-db mysqldump \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  waukesha_atlas > $BACKUP_DIR/backup-$(date +%Y%m%d).sql

# Delete backups older than 7 days
find $BACKUP_DIR -name "backup-*.sql" -mtime +7 -delete
```

Make it executable and add to crontab:

```bash
chmod +x ~/backup-atlas-db.sh

# Run daily at 2 AM
crontab -e
# Add this line:
0 2 * * * ~/backup-atlas-db.sh
```

## Maintenance

### Viewing Logs

```bash
docker-compose logs -f mysql
```

### Restarting the Container

```bash
docker-compose restart
```

### Stopping the Container

```bash
docker-compose down
```

### Stopping and Removing Data (⚠️ Destructive)

```bash
# This will delete all database data!
docker-compose down -v
```

### Updating MySQL Version

```bash
# Pull latest MySQL 8.0 image
docker-compose pull

# Recreate container with new image
docker-compose up -d
```

## Monitoring

### Check Container Health

```bash
docker inspect waukesha-atlas-db | grep -A 10 Health
```

### Monitor Resource Usage

```bash
docker stats waukesha-atlas-db
```

### Connect to MySQL CLI

```bash
docker exec -it waukesha-atlas-db mysql -u atlas_user -p
# Enter password when prompted
```

## Troubleshooting

### Container Won't Start

1. Check logs:
   ```bash
   docker-compose logs
   ```

2. Verify port 3306 is not in use:
   ```bash
   sudo netstat -tulpn | grep 3306
   ```

3. Check disk space:
   ```bash
   df -h
   ```

### Connection Refused

1. Verify container is running:
   ```bash
   docker-compose ps
   ```

2. Check if MySQL is accepting connections:
   ```bash
   docker exec waukesha-atlas-db mysqladmin ping -u root -p
   ```

3. Verify firewall rules (if accessing from another machine):
   ```bash
   sudo ufw status
   # Allow MySQL if needed:
   sudo ufw allow 3306/tcp
   ```

### Slow Performance

1. Check resource usage:
   ```bash
   docker stats waukesha-atlas-db
   ```

2. Increase memory limit in `docker-compose.yml`:
   ```yaml
   services:
     mysql:
       # ... other config
       deploy:
         resources:
           limits:
             memory: 2G
   ```

### Reset Database (Development Only)

```bash
# Stop and remove container and volumes
docker-compose down -v

# Recreate
docker-compose up -d

# Re-run migrations from application
npm run db:push
npm run db:seed
```

## Security Best Practices

1. **Change default passwords** in `.env` file
2. **Restrict network access** - bind to `127.0.0.1` if possible
3. **Regular backups** - set up automated backup script
4. **Keep MySQL updated** - regularly pull latest MySQL 8.0 image
5. **Monitor logs** - watch for suspicious connection attempts
6. **Use strong passwords** - minimum 16 characters with special characters
7. **Limit root access** - use `atlas_user` for application connections

## Support

For issues or questions:
- Check Docker logs: `docker-compose logs`
- Verify environment variables are set correctly
- Ensure network connectivity between containers
- Review MySQL error logs in container
