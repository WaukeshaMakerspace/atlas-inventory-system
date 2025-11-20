# Waukesha Makers Atlas - AWS Deployment Guide

This guide covers deploying the Waukesha Makers Atlas application to AWS using:
- **Amazon RDS** for MySQL database
- **AWS Amplify** for Next.js application hosting
- **Route 53** for DNS management with custom domain `atlas.waukeshamakers.com`

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with your code
- Route 53 hosted zone for `waukeshamakers.com` (already configured)
- WildApricot OAuth credentials
- AWS CLI installed (optional but recommended)

---

## 💰 Cost Optimization for Nonprofits

**Great News!** You can run this application **essentially FREE for 5+ years** by leveraging:

### AWS Free Tier (First 12 Months)
- ✅ **750 hours/month** of RDS db.t3.micro (run 24/7 for free)
- ✅ **20 GB** database storage
- ✅ **20 GB** backup storage
- ✅ Amplify free tier includes build minutes and hosting

**Year 1 Cost: ~$5-15/month** (only Amplify usage charges)

### AWS Nonprofit Credits (After Year 1)
- ✅ **$2,000 in AWS credits** for 501(c)(3) nonprofits
- ✅ Valid for 1-2 years
- ✅ Covers RDS, Amplify, Route 53, and more

**How to Apply**:
1. Visit: [AWS Nonprofit Credit Program](https://aws.amazon.com/government-education/nonprofits/)
2. Provide your EIN and 501(c)(3) documentation
3. Describe your use case (inventory management for makerspace community)
4. Approval typically takes 1-2 weeks

**Combined Strategy**:
- **Year 1**: Use Free Tier → ~$5-15/month
- **Years 2-5+**: Use Nonprofit Credits → **$0/month**

### Total Cost Projection
| Period | Services | Monthly Cost | Annual Cost |
|--------|----------|--------------|-------------|
| Year 1 | Free Tier + Amplify | ~$10/month | ~$120/year |
| Year 2-5+ | Nonprofit Credits | $0/month | $0/year |
| **5-Year Total** | | | **~$120** |

**💡 Recommendation**: Start with Free Tier (db.t3.micro), then apply for nonprofit credits before your first year ends.

---

## Part 1: Deploy MySQL Database to Amazon RDS

### 💡 Free Tier Configuration Summary

To stay within AWS Free Tier for Year 1, ensure these settings:
- ✅ **Instance**: db.t3.micro or db.t2.micro
- ✅ **Storage**: 20 GB or less (General Purpose SSD)
- ✅ **Multi-AZ**: Disabled (Single-AZ only)
- ✅ **Template**: Free tier or Dev/Test (not Production with Multi-AZ)

Following these settings = **$0/month for database** in Year 1!

---

### Step 1: Create RDS MySQL Database

1. **Navigate to RDS Console**
   - Go to AWS Console → Services → RDS
   - Click "Create database"

2. **Choose Database Creation Method**
   - Select: **Standard create**

3. **Engine Options**
   - Engine type: **MySQL**
   - Version: **MySQL 8.0.x** (latest 8.0 version)

4. **Templates**
   - **Recommended**: **Free tier** (if eligible)
   - Or: **Dev/Test** (single AZ, lower cost)
   - Or: **Production** (multi-AZ, higher reliability)

5. **Settings**
   - DB instance identifier: `waukesha-atlas-db`
   - Master username: `admin`
   - Master password: *Create a strong password and save it securely*
   - Confirm password

6. **Instance Configuration** ⭐ Important for Free Tier

   **Recommended for Free Tier (Year 1)**:
   - DB instance class: **db.t3.micro** ✅ **FREE TIER ELIGIBLE**
   - Burstable classes → t3 → db.t3.micro
   - Specs: 1 vCPU, 1 GB RAM
   - **Perfect for**: Hundreds of resources, multiple concurrent users

   **Alternative Options** (not free tier):
   - **db.t3.small**: 2 vCPU, 2 GB RAM (~$30/month)
   - **db.t3.medium**: 2 vCPU, 4 GB RAM (~$60/month)

7. **Storage** ⭐ Free Tier Includes 20 GB

   **Recommended for Free Tier**:
   - Storage type: **General Purpose SSD (gp2 or gp3)**
   - Allocated storage: **20 GB** ✅ **FREE TIER INCLUDED**
   - Enable storage autoscaling: **Yes** (only pay if you exceed 20 GB)
   - Maximum storage threshold: **50 GB** (conservative limit)

   **Note**: Free tier includes 20 GB storage. Additional storage costs ~$0.115/GB/month.

8. **Connectivity**
   - Virtual private cloud (VPC): Select default VPC or create new one
   - Public access: **Yes** (for easier initial setup; can be changed later)
   - VPC security group: Create new or select existing
     - Security group name: `waukesha-atlas-db-sg`
   - Availability Zone: **No preference** (Single-AZ for free tier)
   - **Multi-AZ deployment**: **NO** ⚠️ Must be disabled for Free Tier
   - Database port: **3306**

   **Important**: Multi-AZ deployment doubles your instance hours and is NOT covered by free tier.

9. **Database Authentication**
   - Select: **Password authentication**

10. **Additional Configuration**
    - Initial database name: `waukesha_atlas`
    - DB parameter group: default
    - Backup retention period: **7 days** (production) or **1 day** (dev)
    - **Backup window**: Can leave as default
    - Enable encryption: **Yes** (recommended, still free tier eligible)
    - Enable automatic minor version upgrades: **Yes**
    - Monitoring: Enhanced monitoring is optional (costs extra, not needed for free tier)

11. **Click "Create database"**
    - This will take 5-10 minutes to provision

### Step 2: Configure Security Group

After the database is created:

1. **Navigate to the database instance**
   - Click on `waukesha-atlas-db`
   - Go to "Connectivity & security" tab
   - Click on the VPC security group

2. **Edit Inbound Rules**
   - Click "Edit inbound rules"
   - Add rule:
     - Type: **MySQL/Aurora**
     - Protocol: **TCP**
     - Port: **3306**
     - Source: **0.0.0.0/0** (for initial setup; restrict later)
   - Click "Save rules"

   **Security Note**: For production, you should restrict the source to:
   - Your development IP address
   - AWS Amplify's IP ranges
   - Or use AWS PrivateLink/VPC peering for better security

### Step 3: Note Database Connection Details

1. Go to your RDS instance details
2. Copy and save:
   - **Endpoint**: Something like `waukesha-atlas-db.xxxxxxxxx.us-east-1.rds.amazonaws.com`
   - **Port**: `3306`
   - **Master username**: `admin`
   - **Database name**: `waukesha_atlas`

3. **Construct your DATABASE_URL**:
   ```
   mysql://admin:YOUR_PASSWORD@waukesha-atlas-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:3306/waukesha_atlas
   ```

### Step 4: Test Database Connection

From your local machine:

```bash
# Install MySQL client if not already installed
# macOS:
brew install mysql-client

# Test connection
mysql -h waukesha-atlas-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -P 3306 -u admin -p
# Enter password when prompted

# If successful, you should see MySQL prompt
mysql> SHOW DATABASES;
mysql> USE waukesha_atlas;
mysql> exit
```

### Step 5: Run Database Migrations

From your local machine:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="mysql://admin:YOUR_PASSWORD@waukesha-atlas-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:3306/waukesha_atlas"

# Run migrations
npm run db:push

# (Optional) Seed initial data
npm run db:seed
```

### Step 6: Create Application Database User (Recommended)

For better security, create a separate user for the application:

```bash
# Connect as admin
mysql -h waukesha-atlas-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -P 3306 -u admin -p

# In MySQL prompt:
CREATE USER 'atlas_app'@'%' IDENTIFIED BY 'your_secure_app_password';
GRANT ALL PRIVILEGES ON waukesha_atlas.* TO 'atlas_app'@'%';
FLUSH PRIVILEGES;
exit
```

Update your DATABASE_URL to use the new user:
```
mysql://atlas_app:your_secure_app_password@waukesha-atlas-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:3306/waukesha_atlas
```

---

## Part 2: Deploy Next.js Application to AWS Amplify

### Step 1: Prepare Your Repository

1. **Ensure code is pushed to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for AWS deployment"
   git push origin master
   ```

2. **Create a release tag** (optional but recommended)
   ```bash
   git tag -a v1.0.0 -m "Initial release"
   git push origin v1.0.0
   ```

### Step 2: Connect Repository to AWS Amplify

1. **Navigate to AWS Amplify Console**
   - Go to AWS Console → Services → AWS Amplify
   - Click "Get started" under "Amplify Hosting"

2. **Connect Repository**
   - Select: **GitHub**
   - Click "Continue"
   - Authorize AWS Amplify to access your GitHub account
   - Select repository: `waukesha-makers-atlas`
   - Select branch: `master`
   - Click "Next"

### Step 3: Configure Build Settings

1. **App name**: `waukesha-makers-atlas`

2. **Build and test settings**

   Amplify should auto-detect Next.js and generate this configuration:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

   **Update this to**:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - echo "Running database migrations..."
           - npm run db:push
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Advanced settings**
   - Click "Advanced settings"
   - Add environment variables (see next step)

### Step 4: Add Environment Variables

Add the following environment variables in Amplify:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `DATABASE_URL` | `mysql://atlas_app:password@your-rds-endpoint:3306/waukesha_atlas` | RDS connection string |
| `NEXTAUTH_URL` | `https://atlas.waukeshamakers.com` | Your production URL |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | NextAuth secret |
| `WILDAPRICOT_CLIENT_ID` | Your client ID | WildApricot OAuth |
| `WILDAPRICOT_CLIENT_SECRET` | Your client secret | WildApricot OAuth |
| `WILDAPRICOT_ACCOUNT_ID` | Your account ID | WildApricot account |

**Important**:
- Store sensitive values in AWS Secrets Manager for production
- Update WildApricot OAuth redirect URI to `https://atlas.waukeshamakers.com/api/auth/callback/wildapricot`

### Step 5: Create IAM Service Role

1. In the build settings page, under "Service role":
   - Select "Create new role"
   - Follow the wizard to create a role
   - Or select existing role if you have one

2. Click "Next"

### Step 6: Review and Deploy

1. **Review all settings**
2. Click "Save and deploy"
3. Amplify will start building your app (takes 5-10 minutes)

### Step 7: Monitor Build

1. Watch the build logs in real-time
2. If build fails:
   - Check environment variables are set correctly
   - Check database connectivity
   - Review build logs for errors

---

## Part 3: Configure Custom Domain (atlas.waukeshamakers.com)

### Step 1: Add Custom Domain in Amplify

1. **In your Amplify app console**:
   - Go to "Domain management" in the left sidebar
   - Click "Add domain"

2. **Enter domain**:
   - Domain: `waukeshamakers.com`
   - Click "Configure domain"

3. **Configure subdomains**:
   - Remove the `www` subdomain if present
   - Keep or add: `atlas`
   - Target branch: `master`
   - Click "Save"

### Step 2: Update Route 53 DNS Records

Amplify will provide DNS configuration instructions:

**Option A: Automatic (Recommended)**
- If Route 53 hosted zone is in the same AWS account:
  - Amplify will automatically create the DNS records
  - Click "Update DNS" button

**Option B: Manual**
1. Go to Route 53 → Hosted zones → `waukeshamakers.com`
2. Create a new record:
   - Record name: `atlas`
   - Record type: `CNAME`
   - Value: The Amplify subdomain (e.g., `master.xxxxxxxxx.amplifyapp.com`)
   - TTL: `300`
   - Click "Create records"

### Step 3: SSL Certificate

1. Amplify automatically provisions an SSL certificate via AWS Certificate Manager
2. This process takes 5-30 minutes
3. Wait for domain status to show "Available"

### Step 4: Verify Domain

1. Once SSL certificate is issued, test your domain:
   ```bash
   curl https://atlas.waukeshamakers.com
   ```

2. Open in browser: `https://atlas.waukeshamakers.com`

---

## Part 4: Configure Build Triggers for Release Tags

### Option A: Deploy All Commits to Master (Default)

By default, Amplify deploys every commit to the `master` branch.

### Option B: Deploy Only on Release Tags

To deploy only when you create a release tag:

#### Step 1: Modify Branch Settings

1. **In Amplify Console**:
   - Go to your app → "Build settings"
   - Under "Branch" section, find `master`
   - Click on `master` branch
   - Toggle "Enable auto-build" to **OFF**

#### Step 2: Create Webhook for Tags

1. **In Amplify Console**:
   - Go to "Build settings"
   - Scroll to "Incoming webhooks"
   - Click "Create webhook"
   - Webhook name: `release-trigger`
   - Target branch: `master`
   - Click "Save"
   - Copy the webhook URL

#### Step 3: Configure GitHub Webhook

1. **In GitHub Repository**:
   - Go to Settings → Webhooks → Add webhook
   - Payload URL: Paste the Amplify webhook URL
   - Content type: `application/json`
   - Which events: Select "Let me select individual events"
     - Uncheck "Pushes"
     - Check "Branch or tag creation"
   - Active: Check
   - Click "Add webhook"

#### Step 4: Create Release Tag Workflow (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'  # Triggers on tags like v1.0.0, v2.1.3, etc.

jobs:
  trigger-amplify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Amplify Build
        run: |
          curl -X POST -d {} "${{ secrets.AMPLIFY_WEBHOOK_URL }}"
```

Add the webhook URL as a GitHub secret:
- Go to GitHub repo → Settings → Secrets and variables → Actions
- New repository secret
- Name: `AMPLIFY_WEBHOOK_URL`
- Value: Your Amplify webhook URL

#### Step 5: Creating Releases

To deploy:

```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# This will trigger the Amplify build
```

Or create releases through GitHub UI:
- Go to repository → Releases → Create a new release
- Create new tag (e.g., `v1.0.1`)
- Publish release

---

## Part 5: Optional Cost Optimizations (Free Tier)

These steps are **optional** but recommended for ultra-low-traffic sites (like yours with 5 users). They can reduce your costs from ~$10-15/month to **~$1-6/month** in Year 1.

### Why These Optimizations?

For your small workshop with 5 users accessing a couple times per week:
- ✅ **CloudFront**: Caches content, reduces Amplify bandwidth costs, **Always Free** tier
- ✅ **S3**: Store images/files cheaper than alternatives, **12 months free** + generous limits

**Cost Impact**:
- Without optimizations: ~$10-15/month Year 1
- With optimizations: **~$1-6/month Year 1**
- **Savings**: ~$50-100/year

---

### Option A: Add Amazon S3 for Image Storage

Use S3 if you want to add photos of resources, equipment manuals, or other files.

#### Step 1: Create S3 Bucket

1. **Navigate to S3 Console**:
   - AWS Console → Services → S3
   - Click "Create bucket"

2. **Bucket Settings**:
   - Bucket name: `waukesha-atlas-media` (must be globally unique)
   - AWS Region: Same as your RDS (e.g., us-east-1)
   - Object Ownership: **ACLs disabled** (recommended)
   - Block Public Access: **Uncheck "Block all public access"** (we need public read)
     - Check: "I acknowledge that the current settings might result in this bucket and the objects within becoming public"
   - Bucket Versioning: **Disable** (to save storage)
   - Encryption: **Enable** (SSE-S3, free)
   - Click "Create bucket"

#### Step 2: Configure Bucket Policy

1. **Go to your bucket** → "Permissions" tab
2. **Bucket Policy** → "Edit"
3. Add this policy (replace `waukesha-atlas-media` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::waukesha-atlas-media/*"
    }
  ]
}
```

#### Step 3: Enable CORS

1. **CORS Configuration** → "Edit"
2. Add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://atlas.waukeshamakers.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### Step 4: Create IAM User for Amplify

1. **IAM Console** → "Users" → "Create user"
2. User name: `amplify-s3-upload`
3. **Attach policies directly** → "Create policy"
4. JSON policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::waukesha-atlas-media",
        "arn:aws:s3:::waukesha-atlas-media/*"
      ]
    }
  ]
}
```

5. Create policy → Go back and attach to user
6. **Create access key** → "Application running outside AWS"
7. **Save Access Key ID and Secret Access Key** (you won't see secret again!)

#### Step 5: Add Environment Variables to Amplify

Add these to your Amplify environment variables:

| Variable | Value |
|----------|-------|
| `AWS_S3_BUCKET_NAME` | `waukesha-atlas-media` |
| `AWS_S3_REGION` | `us-east-1` (your region) |
| `AWS_S3_ACCESS_KEY_ID` | Your access key from Step 4 |
| `AWS_S3_SECRET_ACCESS_KEY` | Your secret key from Step 4 |

#### Step 6: Update Next.js Config for S3

Update `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... existing config

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'waukesha-atlas-media.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'waukesha-atlas-media.s3.us-east-1.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
```

**Free Tier Usage**:
- ✅ **5 GB storage** (hundreds of images)
- ✅ **20,000 GET requests/month** (more than enough for 5 users)
- ✅ **2,000 PUT requests/month** (plenty for uploads)

Your usage: **FREE** for Year 1, then ~$0.10-0.50/month after

---

### Option B: Add CloudFront CDN (Recommended)

CloudFront caches your content globally and reduces Amplify bandwidth costs. Has an **Always Free** tier.

#### Step 1: Create CloudFront Distribution

1. **CloudFront Console** → "Create distribution"

2. **Origin Settings**:
   - Origin domain: Your Amplify domain (e.g., `master.xxxx.amplifyapp.com`)
   - Protocol: **HTTPS only**
   - Origin path: Leave empty
   - Name: Auto-filled

3. **Default Cache Behavior**:
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
   - Cache policy: **CachingOptimized**
   - Origin request policy: **AllViewer**

4. **Settings**:
   - Price class: **Use all edge locations** (best performance)
   - Alternate domain name (CNAME): `atlas.waukeshamakers.com`
   - Custom SSL certificate: Select your existing certificate (or create new)
   - Default root object: Leave empty (Amplify handles this)

5. **Click "Create distribution"**
   - Takes 5-15 minutes to deploy

#### Step 2: Update Route 53

1. **Route 53** → Hosted zones → `waukeshamakers.com`
2. Find the `atlas` CNAME record
3. **Edit record**:
   - Change from: Amplify subdomain
   - Change to: CloudFront domain (e.g., `d1234abcd.cloudfront.net`)
   - Or use **Alias** record pointing to CloudFront distribution
4. **Save**

#### Step 3: Update Amplify Domain Settings

1. **Amplify Console** → Your app → "Domain management"
2. **Note**: CloudFront is now serving your site
3. Keep Amplify domain for direct access if needed

#### Step 4: Test CloudFront

1. Wait for DNS propagation (5-30 minutes)
2. Visit: `https://atlas.waukeshamakers.com`
3. Check response headers for `X-Cache: Hit from cloudfront`

**Benefits**:
- ✅ **1 TB data transfer/month** (Always Free)
- ✅ **10 million requests/month** (Always Free)
- ✅ Faster page loads (edge caching)
- ✅ Reduces Amplify bandwidth costs
- ✅ Better performance worldwide

Your usage with 5 users: **Maybe 1-5 GB/month** = **FREE forever** ✅

---

### Cost Comparison with Optimizations

| Configuration | Year 1 Monthly | Year 1 Annual | Years 2-5+ |
|--------------|----------------|---------------|------------|
| **Basic** (No optimization) | $10-15 | $120-180 | $0 (nonprofit) |
| **+ CloudFront** | $1-6 | $12-72 | $0 (nonprofit) |
| **+ CloudFront + S3** | $1-6 | $12-72 | $0 (nonprofit) |

**Recommendation**: Add CloudFront (5-minute setup, permanent savings)

---

## Part 6: Post-Deployment Configuration

### Update WildApricot OAuth Settings

1. Log in to WildApricot admin panel
2. Go to OAuth application settings
3. Update redirect URI to:
   ```
   https://atlas.waukeshamakers.com/api/auth/callback/wildapricot
   ```

### Test Authentication

1. Visit `https://atlas.waukeshamakers.com`
2. Click "Sign in"
3. Authenticate with WildApricot
4. Verify you can access authenticated features

### Monitor Application

1. **CloudWatch Logs**:
   - Amplify → Your app → "Monitoring"
   - View logs and metrics

2. **Access Logs**:
   - Enable access logs for debugging
   - Amplify → App settings → Monitoring

---

## Part 7: Ongoing Maintenance

### Database Backups

RDS automatically backs up your database daily. To create manual backup:

1. Go to RDS Console → Databases
2. Select your database
3. Actions → Take snapshot
4. Name: `waukesha-atlas-manual-backup-YYYY-MM-DD`

### Database Restore

If you need to restore:

1. RDS Console → Snapshots
2. Select snapshot
3. Actions → Restore snapshot
4. Update connection string in Amplify

### Scaling

#### Scale Database:
1. RDS Console → Select database
2. Modify → Change instance class
3. Apply changes (can schedule maintenance window)

#### Scale Application:
- Amplify automatically scales based on traffic
- No manual intervention needed

### Monitoring Costs

1. **AWS Cost Explorer**:
   - Monitor RDS and Amplify costs
   - Set up billing alerts (recommended: $50/month threshold)
   - Track free tier usage

2. **Cost Breakdown with Free Tier + Nonprofit Strategy**:

   **Year 1 (AWS Free Tier)**:
   - RDS db.t3.micro (750 hrs/month): **$0** ✅ Free Tier
   - RDS Storage (20 GB): **$0** ✅ Free Tier
   - RDS Backups (20 GB): **$0** ✅ Free Tier
   - Amplify Hosting: **~$5-15/month** (1000 build minutes free, then $0.01/min)
   - Route 53: **~$0.50/month**
   - **Total Year 1**: **~$10-15/month** or **~$120-180/year**

   **Years 2-5+ (AWS Nonprofit Credits)**:
   - All services: **$0** ✅ Covered by $2,000 nonprofit credits
   - **Total Years 2-5+**: **$0/year**

   **5-Year Total Cost**: **~$120-180**

3. **Setting Up Billing Alerts**:
   ```
   AWS Console → Billing Dashboard → Budgets → Create budget
   - Template: Monthly cost budget
   - Budget amount: $50
   - Alert threshold: 80% ($40)
   ```

4. **Free Tier Usage Dashboard**:
   - AWS Console → Billing → Free Tier
   - Monitor RDS hours (should stay under 750/month)
   - Check storage usage (should stay under 20 GB)

---

## Part 8: Troubleshooting

### Build Failures

1. **Check build logs** in Amplify console
2. **Common issues**:
   - Environment variables not set
   - Database connection timeout
   - Node version mismatch

**Solutions**:
- Verify all environment variables are set
- Check RDS security group allows connections
- Specify Node version in `package.json`:
  ```json
  "engines": {
    "node": ">=18.0.0"
  }
  ```

### Database Connection Issues

1. **Check security group** allows inbound connections
2. **Verify credentials** are correct
3. **Test connection** from local machine
4. **Check RDS status** - ensure it's "Available"

### Domain Not Working

1. **Verify DNS propagation**:
   ```bash
   dig atlas.waukeshamakers.com
   nslookup atlas.waukeshamakers.com
   ```

2. **Check SSL certificate status** in Amplify
3. **Wait** - DNS propagation can take up to 48 hours (usually much faster)

### Application Errors

1. **Check CloudWatch Logs** in Amplify
2. **Enable detailed logging** in Next.js:
   ```javascript
   // next.config.ts
   const nextConfig = {
     // ...
     logging: {
       fetches: {
         fullUrl: true,
       },
     },
   };
   ```

---

## Part 9: Security Best Practices

### Database Security

1. **Restrict public access**:
   - After initial setup, change RDS to private
   - Use VPC peering or AWS PrivateLink

2. **Use SSL/TLS**:
   - Download RDS CA certificate
   - Update DATABASE_URL to include SSL parameters

3. **Enable encryption at rest**: Already enabled during setup

4. **Regular password rotation**:
   - Change RDS password periodically
   - Use AWS Secrets Manager for automatic rotation

### Application Security

1. **Use AWS Secrets Manager** for sensitive data:
   - Store database password
   - Store OAuth secrets
   - Reference in Amplify using parameter store

2. **Enable AWS WAF** (optional):
   - Add CloudFront distribution
   - Configure WAF rules for protection

3. **Monitor access**:
   - Enable CloudTrail
   - Review CloudWatch logs regularly

---

## Part 10: Rollback Procedures

### Rollback Application

1. **In Amplify Console**:
   - Go to your app
   - Click on a previous successful build
   - Click "Redeploy this version"

### Rollback Database

1. **Restore from snapshot**:
   - RDS Console → Snapshots
   - Select snapshot before the issue
   - Restore to new instance
   - Update DATABASE_URL in Amplify

---

## Quick Reference Commands

### Create Release Tag
```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

### Test Database Connection
```bash
mysql -h your-rds-endpoint.rds.amazonaws.com -P 3306 -u atlas_app -p
```

### Run Migrations Locally Against RDS
```bash
export DATABASE_URL="mysql://atlas_app:password@your-rds-endpoint:3306/waukesha_atlas"
npm run db:push
```

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

---

## Support and Resources

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Amazon RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)

---

## Checklist

### Database Setup
- [ ] RDS MySQL instance created
- [ ] Security group configured
- [ ] Database connection tested
- [ ] Migrations run successfully
- [ ] Application user created
- [ ] Initial data seeded

### Amplify Setup
- [ ] Repository connected
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] First build successful
- [ ] Application accessible via Amplify URL

### Domain Configuration
- [ ] Custom domain added in Amplify
- [ ] Route 53 DNS records created
- [ ] SSL certificate issued
- [ ] Domain accessible via HTTPS
- [ ] WildApricot OAuth redirect updated

### Release Tag Configuration (Optional)
- [ ] Auto-build disabled for master
- [ ] Webhook created in Amplify
- [ ] GitHub webhook configured
- [ ] Test release tag created
- [ ] Build triggered successfully

### Post-Deployment
- [ ] Authentication tested
- [ ] All features working
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Costs reviewed
