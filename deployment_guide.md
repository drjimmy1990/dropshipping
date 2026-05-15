# DropLinker Production Deployment Guide

This guide covers deploying the DropLinker Next.js application to your VPS, ensuring it runs on a custom port (e.g., `4000` instead of the default `3000`) and is served securely via Nginx and PM2.

## 1. Prepare and Push Your Code

Ensure all your latest changes are committed and pushed to your remote repository.

```bash
git add .
git commit -m "feat: complete AliExpress OAuth and admin UI"
git push origin main
```

## 2. Pull the Code on the VPS

SSH into your VPS and navigate to the directory where your application will live.

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to your web directory (example path)
cd /var/www/droplinker

# Pull the latest changes
git pull origin main
```

## 3. Configure Environment Variables

Ensure your `.env.local` or `.env.production` file on the VPS is fully configured with your Supabase keys and AliExpress credentials. **Do not commit `.env.local` to GitHub.**

```bash
nano app/.env.local
```

Ensure it contains:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

ALIEXPRESS_APP_KEY="534306"
ALIEXPRESS_APP_SECRET="2Nm8YDXEYUsDfwtICrZUlHISeWPTAADN"
```

## 4. Install Dependencies and Build

Navigate into the Next.js `app` folder (where your `package.json` is located), install the dependencies, and generate the production build.

```bash
cd app
npm install
npm run build
```

## 5. Run the App on a Custom Port using PM2

To keep the app running in the background and specify a custom port (e.g., `4000`), use PM2.

```bash
# Install PM2 globally if you haven't already
npm install -g pm2

# Start the Next.js app on port 4000
pm2 start npm --name "droplinker" -- start -- -p 4000

# Save the PM2 process list so it restarts on server reboot
pm2 save
pm2 startup
```

> [!TIP]
> You can check the logs of your running application at any time using `pm2 logs droplinker`.

## 6. Configure Nginx Reverse Proxy

You need to configure Nginx to proxy traffic from `https://droplinker.asra3.com` to your local app running on port `4000`.

Open or create your Nginx configuration file for the domain:
```bash
sudo nano /etc/nginx/sites-available/droplinker.asra3.com
```

Ensure the `location /` block looks like this:

```nginx
server {
    listen 80;
    server_name droplinker.asra3.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Real IP Forwarding
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If you are using **aaPanel**, you can easily do this via the aaPanel UI:
1. Go to **Websites**.
2. Click on the configuration for `droplinker.asra3.com`.
3. Go to **Reverse Proxy**.
4. Add a new Reverse Proxy pointing to `http://localhost:4000`.

## 7. Reload Nginx

Test the Nginx configuration to make sure there are no syntax errors, then reload the service.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Final Verification

1. Go to `https://droplinker.asra3.com/admin/settings` in your browser.
2. Click the **Connect** button under the AliExpress section.
3. You should be redirected to AliExpress, prompted to log in, and then successfully redirected back to your settings page!
