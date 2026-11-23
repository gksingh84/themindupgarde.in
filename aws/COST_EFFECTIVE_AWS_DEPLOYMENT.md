# Cost-Effective AWS Hosting Guide for THE MIND UPGRADE

This guide outlines the most budget-friendly, production-ready architectures to host **THE MIND UPGRADE** on AWS using your existing domain purchased through WordPress.

---

## 1. Cost Comparison: AWS Options

| Feature | Option A: AWS Lightsail (Recommended) | Option B: AWS Amplify Hosting | Option C: Traditional AWS (ECS + ALB + RDS) |
| :--- | :--- | :--- | :--- |
| **Monthly Cost** | **$3.50 – $5.00 / month flat** | **$0 – $5.00 / month** (Pay-as-you-go) | **$70.00 – $120.00 / month** |
| **Free Tier** | **3 Months FREE** (90-day trial) | 12 Months Free Tier (1,000 build mins/mo) | Partial (t2/t3.micro 750 hrs, ALB costs $20+/mo) |
| **Compute** | 1–2 vCPU, 1–2 GB RAM, 40GB SSD | Serverless Next.js App Router | ECS Fargate + ALB |
| **Database** | Included local PostgreSQL container ($0) | External DB needed (Supabase/Neon free) | Amazon RDS PostgreSQL ($18–$30/mo) |
| **Data Transfer** | **1 TB to 2 TB FREE included** | 15 GB free, then $0.15/GB | Bandwidth + NAT Gateway ($32/mo) |
| **Static IP & SSL** | **Free Static IP & Free Let's Encrypt SSL** | Free managed SSL | ACM free, ALB charge applies |
| **Predictability** | **100% predictable fixed bill** | Variable depending on traffic | Variable with surprise charges |

> **Recommendation:** **Option A (AWS Lightsail)** is by far the most cost-effective and headache-free. You get a dedicated Linux VPS in Mumbai (`ap-south-1`) with a static IP, bundled SSD storage, 1–2 TB free monthly bandwidth, and zero hidden network costs for just **$3.50/month (with the first 3 months completely free)**.

---

## 2. Step 1: Connect WordPress Domain to AWS (Without Transfer Fees)

You do **NOT** need to pay WordPress any domain transfer fees. Keep the domain registered at WordPress and simply point its DNS records to AWS.

### How to update DNS in WordPress.com:
1. Log in to [wordpress.com](https://wordpress.com).
2. Go to **Upgrades** $\rightarrow$ **Domains** (or **Settings** $\rightarrow$ **Domains**).
3. Click on your domain name (e.g. `themindupgrade.in`).
4. Click on **DNS Records** (or **Manage DNS**).
5. If WordPress Name Servers are active, add the following two records:
   - **Record 1 (Apex Domain):**
     - Type: `A`
     - Name: `@` (or leave blank)
     - Value: `YOUR_LIGHTSAIL_STATIC_IP` (e.g., `13.234.xx.xx`)
     - TTL: `Auto` (or `300`)
   - **Record 2 (WWW Subdomain):**
     - Type: `CNAME`
     - Name: `www`
     - Value: `themindupgrade.in.`
     - TTL: `Auto`
6. Click **Save Records**. DNS propagation typically takes between 5 to 30 minutes.

---

## 3. Step 2: Create AWS Lightsail Instance (5-Minute Walkthrough)

1. Log into your [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **Lightsail** and open the service.
3. Click **Create instance**.
4. **Select Location:**
   - Choose **Mumbai (`ap-south-1`)** for the fastest loading speeds in India.
5. **Select Platform & Blueprint:**
   - Platform: **Linux / Unix**
   - Blueprint: **OS Only** $\rightarrow$ select **Ubuntu 24.04 LTS** (or **Ubuntu 22.04 LTS**).
6. **Choose Instance Plan:**
   - Select the **$3.50/mo** plan (512MB RAM, 1 vCPU, 20GB SSD, 1TB Transfer) or the **$5.00/mo** plan (1GB RAM, 1 vCPU, 40GB SSD, 2TB Transfer).
   - *Note: The $3.50 and $5.00 plans come with 3 months free.*
7. **Name Your Instance:**
   - e.g., `themindupgrade-web`
8. Click **Create instance**. It will be running in about 60 seconds.

---

## 4. Step 3: Attach a Free Static IP

AWS Lightsail gives you a static public IPv4 address for free as long as it's attached to your instance:
1. In the Lightsail dashboard, go to the **Networking** tab.
2. Click **Create static IP**.
3. Select your instance (`themindupgrade-web`).
4. Name it `themindupgrade-ip` and click **Create**.
5. Copy this Static IP address (e.g., `13.234.120.45`). **This is the IP you enter in your WordPress DNS (Step 1).**

---

## 5. Step 4: Open Firewall Ports in Lightsail

1. Click on your instance (`themindupgrade-web`) $\rightarrow$ click the **Networking** tab.
2. Under **IPv4 Firewall**, ensure the following ports are open:
   - **SSH (Port 22)**
   - **HTTP (Port 80)**
   - **HTTPS (Port 443)**
   - *(Optional: Custom Port 3000 if testing directly without Nginx reverse proxy)*
3. Click **Save**.

---

## 6. Step 5: Deploy the Application

In Lightsail, click the orange **terminal icon** on your instance card to open a browser-based SSH terminal (or connect via standard SSH).

### Option 1: Automated Script (Fastest)
Copy and run our setup script:
```bash
# Download setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/themindupgrade/main/aws/lightsail-setup.sh
# Make executable and run
chmod +x lightsail-setup.sh
./lightsail-setup.sh
```

### Option 2: Manual Commands
```bash
# 1. Update packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install -y docker-compose-plugin git nginx certbot python3-certbot-nginx

# 3. Clone or upload your repository
git clone https://github.com/YOUR_USERNAME/themindupgrade.git /home/ubuntu/themindupgrade
cd /home/ubuntu/themindupgrade

# 4. Launch containers (Next.js App + PostgreSQL Database)
docker compose up -d --build

# 5. Point Nginx to Docker container
sudo cp aws/nginx.conf /etc/nginx/sites-available/themindupgrade
sudo ln -s /etc/nginx/sites-available/themindupgrade /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 6. Issue Free SSL (HTTPS)
sudo certbot --nginx -d themindupgrade.in -d www.themindupgrade.in
```

---

## 7. Step 6: Automated Backups & Maintenance

1. **Lightsail Automatic Snapshots:**
   - In Lightsail $\rightarrow$ Click your instance $\rightarrow$ **Snapshots** tab.
   - Toggle **Automatic snapshots** ON (takes a daily backup; costs ~$0.05/month).
2. **Auto-Renewing SSL:**
   - Let's Encrypt certificates renew automatically via a systemd timer installed by Certbot.
   - Test renewal anytime: `sudo certbot renew --dry-run`.
