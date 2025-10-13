# 🚀 Deployment Guide for multiminder.duckdns.org

## Prerequisites

- Ubuntu/Debian server with nginx
- Docker and Docker Compose (optional)
- Domain: multiminder.duckdns.org
- SSL certificate (Let's Encrypt)

## Quick Start

### Option 1: Direct nginx deployment

1. **Build and deploy:**

   ```bash
   npm run deploy:prod
   ```

2. **Manual steps:**

   ```bash
   # Build the project
   npm run build

   # Copy to nginx directory
   sudo cp -r dist/* /var/www/multiminder.duckdns.org/

   # Set permissions
   sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/
   ```

### Option 2: Docker deployment

1. **Build Docker image:**

   ```bash
   npm run docker:build
   ```

2. **Run with Docker Compose:**
   ```bash
   npm run docker:compose
   ```

## SSL Certificate Setup

1. **Install Certbot:**

   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d multiminder.duckdns.org
   ```

## nginx Configuration

The `nginx.conf` file includes:

- ✅ Proper MIME types for JavaScript modules
- ✅ Gzip compression
- ✅ Security headers
- ✅ SPA routing support
- ✅ Static asset caching

## Troubleshooting

### MIME Type Errors

If you see "Expected a JavaScript module script" errors:

1. Check nginx configuration has proper MIME types
2. Ensure files have `.js` extension (not `.jsx`)
3. Verify nginx is serving files with correct headers

### Module Loading Errors

If you see "Cannot access before initialization" errors:

1. Check for circular dependencies in your code
2. Ensure all imports are properly resolved
3. Verify build output has correct file structure

### SSL Issues

1. Ensure certificate is valid: `sudo certbot certificates`
2. Check nginx SSL configuration
3. Verify domain DNS is pointing to your server

## Environment Variables

Create `.env.production` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://multiminder.duckdns.org/api
```

## Monitoring

- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check application logs: `docker logs <container-name>`
- Monitor SSL certificate: `sudo certbot certificates`

## Security Checklist

- ✅ HTTPS enforced
- ✅ Security headers configured
- ✅ Gzip compression enabled
- ✅ Static assets cached
- ✅ SPA routing handled
- ✅ MIME types correct
