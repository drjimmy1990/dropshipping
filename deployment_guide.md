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
## 8. Automated Deployment (GitHub to aaPanel)

To automatically deploy changes when you push to GitHub, you can use the built-in aaPanel WebHook plugin:

1. In aaPanel, go to **App Store** and install **WebHook**.
2. Open the plugin and click **Add Hook**. Name it `Deploy_Dropshipping`.
3. Paste the following script:

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

# 2. Build the Next.js app
cd app
npm run build

# 3. Restart PM2 process
/usr/local/bin/pm2 restart droplinker || pm2 restart droplinker

# 4. Clear NGINX Cache
rm -rf /www/server/nginx/proxy_cache_dir/* 

echo "Deployment Successful!"
echo "===================================="
```

4. Click **View Key** to get the webhook URL (e.g. `https://panel.yourdomain.com/hook?access_key=...`).
5. Go to your GitHub repository -> **Settings** -> **Webhooks** -> **Add webhook**.
6. Paste the URL, set Content-Type to `application/json`, and save. 

Now, every `git push origin main` will automatically rebuild and restart the app on your VPS.
