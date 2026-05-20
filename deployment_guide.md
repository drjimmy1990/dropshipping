# DropLinker Production Deployment Guide

This guide covers deploying the DropLinker Next.js application to your VPS, ensuring it runs on a custom port (e.g., `4000` instead of the default `3000`) and is served securely via Nginx and PM2.

## 1. Get the Code on the VPS

SSH into your VPS, navigate to the `wwwroot` directory, and clone the repository. If you've already cloned it, you can just pull the latest changes.

```bash
# Navigate to the wwwroot directory
cd /www/wwwroot

# Clone the repository (if you haven't already)
git clone https://github.com/drjimmy1990/dropshipping.git

# Enter the project directory
cd dropshipping

# Pull the latest changes (if you already cloned it previously)
git pull origin main
```

## 2. Configure Environment Variables

Ensure your `.env.local` file is fully configured inside the `app` directory. **Do not commit `.env.local` to GitHub.**

```bash
nano /www/wwwroot/dropshipping/app/.env.local
```

Ensure it contains:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

ALIEXPRESS_APP_KEY="534306"
ALIEXPRESS_APP_SECRET="2Nm8YDXEYUsDfwtICrZUlHISeWPTAADN"
```

## 3. Install Dependencies and Build

Navigate into the Next.js `app` folder, install the dependencies, and generate the production build.

```bash
cd /www/wwwroot/dropshipping/app
npm install
npm run build
```

## 4. Run the App on a Custom Port using PM2

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

## 5. Configure Nginx Reverse Proxy

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

## 6. Reload Nginx

Test the Nginx configuration to make sure there are no syntax errors, then reload the service.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Final Verification

1. Go to `https://droplinker.asra3.com/admin/settings` in your browser.
2. Click the **Connect** button under the AliExpress section.
3. You should be redirected to AliExpress, prompted to log in, and then successfully redirected back to your settings page!

## 8. Auto-Deployment via aaPanel WebHook

Instead of manually SSH-ing and running commands after every code change, you can set up **automated deployment** so that every `git push origin main` triggers a full rebuild on the VPS automatically.

### 8.1 Install the WebHook Plugin

1. Open your **aaPanel** dashboard (`panel.asra3.com`).
2. Go to **App Store** on the left menu.
3. Search for **WebHook** (free official plugin).
4. Click **Install**.

### 8.2 Create the Deployment Hook

1. Once installed, click **Settings** on the WebHook plugin.
2. Click **Add Hook**.
3. **Name:** `Deploy_Dropshipping`
4. **Execution script:**

```bash
#!/bin/bash
echo "===================================="
date --date='0 days ago' "+%Y-%m-%d %H:%M:%S"
echo "Start Deployment..."

# Tell PM2 where to look for processes
export HOME=/root
export PM2_HOME=/root/.pm2

# 1. Pull latest changes
cd /www/wwwroot/dropshipping
git pull origin main

# 2. Stop PM2 BEFORE building (prevents restart during .next rebuild)
/usr/local/bin/pm2 stop droplinker 2>/dev/null || true

# 3. Build the Next.js app
cd app
npm run build

# 4. Restart PM2 (start if stopped, restart if running)
/usr/local/bin/pm2 start droplinker 2>/dev/null || /usr/local/bin/pm2 restart droplinker

# 5. Clear NGINX Cache
rm -rf /www/server/nginx/proxy_cache_dir/*

echo "Deployment Successful!"
echo "===================================="
```

5. Click **Submit**.

> [!IMPORTANT]
> The `HOME=/root` and `PM2_HOME=/root/.pm2` exports are **critical**. Without them, PM2 cannot find the `droplinker` process because aaPanel runs webhook scripts without normal user environment variables.

### 8.3 Connect to GitHub

1. In the aaPanel WebHook list, click **View Key** next to your hook.
2. Copy the key (e.g., `dP7kFFXV2NrSCykMXv5kNJZVdRAv1LhXaC44MnxVAwEutwSn`).
3. Construct the webhook URL:
   ```
   https://panel.asra3.com/hook?access_key=YOUR_KEY_HERE
   ```
4. Go to your GitHub repo: **Settings** → **Webhooks** → **Add webhook**.
5. **Payload URL:** Paste the full URL from step 3.
6. **Content type:** `application/json`.
7. **Events:** Select "Just the push event".
8. Click **Add webhook**.

### 8.4 Verify It Works

1. Make a small code change locally and push:
   ```bash
   git add -A && git commit -m "test: verify auto-deploy" && git push origin main
   ```
2. Wait ~30-60 seconds.
3. Check the WebHook **Log** in aaPanel — you should see `Deployment Successful!`.
4. Refresh your live site to confirm the change is deployed.

> [!TIP]
> You can view deployment logs anytime in aaPanel by clicking **Log** next to the `Deploy_Dropshipping` hook.

## 9. Manual Deployment (Fallback)

If the webhook is unavailable, you can always deploy manually:

```bash
# SSH into your VPS
ssh root@82.208.21.164

# Deploy
cd /www/wwwroot/dropshipping
git pull origin main
pm2 stop droplinker
cd app && npm run build
pm2 start droplinker
rm -rf /www/server/nginx/proxy_cache_dir/*
```
