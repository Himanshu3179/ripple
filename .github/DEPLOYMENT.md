# Deployment Guide

This repository uses GitHub Actions for automated CI/CD to AWS EC2.

## 📋 Prerequisites

1. **EC2 Instance** (Ubuntu 22.04 LTS recommended)

   - Minimum: t2.micro (free tier eligible)
   - Recommended: t3.small or higher for better performance
   - Security Group: Allow SSH (22), HTTP (80), HTTPS (443)

2. **Docker Hub Account** (free tier available)

3. **GitHub Repository** with Actions enabled

## 🔐 Setting Up GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

### Required Secrets

| Secret Name               | Description                                   | Example                                               |
| ------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| `EC2_HOST`                | Your EC2 instance IP or domain                | `ec2-12-34-56-78.compute-1.amazonaws.com`             |
| `EC2_USER`                | SSH username (usually `ubuntu` or `ec2-user`) | `ubuntu`                                              |
| `EC2_SSH_KEY`             | Private SSH key for EC2 access                | `-----BEGIN RSA PRIVATE KEY-----...`                  |
| `EC2_PORT`                | SSH port (optional, defaults to 22)           | `22`                                                  |
| `DOCKERHUB_USERNAME`      | Your Docker Hub username                      | `yourusername`                                        |
| `DOCKERHUB_TOKEN`         | Docker Hub access token                       | `dckr_pat_...`                                        |
| `MONGO_URI`               | MongoDB connection string                     | `mongodb+srv://user:pass@cluster.mongodb.net/ripple`  |
| `JWT_SECRET`              | Secret key for JWT tokens                     | `your-super-secret-key`                               |
| `CLIENT_URL`              | Your application URL                          | `https://yourdomain.com` or `http://your-ec2-ip:4000` |
| `RAZORPAY_KEY_ID`         | Razorpay Key ID                               | `rzp_test_...`                                        |
| `RAZORPAY_KEY_SECRET`     | Razorpay Key Secret                           | `your_razorpay_secret`                                |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret                       | `your_webhook_secret`                                 |

### Optional Secrets

| Secret Name      | Description                                  | Example                      |
| ---------------- | -------------------------------------------- | ---------------------------- |
| `DOMAIN`         | Your domain name (for SSL setup)             | `example.com`                |
| `GEMINI_API_KEY` | Gemini API key for AI features (default)     | `your-gemini-api-key`        |
| `OPENAI_API_KEY` | OpenAI API key for AI features (fallback)    | `sk-...`                     |
| `AI_PROVIDER`    | AI provider to use: 'gemini' or 'openai'     | `gemini` (default)           |

## 🔑 Generating SSH Key for EC2

If you don't have an SSH key pair for EC2:

1. **Generate a new key pair:**

   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/ripple-ec2-key -N ""
   ```

2. **Add public key to EC2 instance:**

   ```bash
   # Copy public key to EC2
   ssh-copy-id -i ~/.ssh/ripple-ec2-key.pub ubuntu@YOUR_EC2_IP

   # Or manually add to ~/.ssh/authorized_keys on EC2
   ```

3. **Add private key to GitHub Secrets:**
   ```bash
   cat ~/.ssh/ripple-ec2-key
   # Copy the entire output including -----BEGIN and -----END lines
   # Paste as EC2_SSH_KEY secret
   ```

## 🐳 Setting Up Docker Hub Token

1. Go to [Docker Hub](https://hub.docker.com/)
2. Go to **Account Settings** → **Security** → **New Access Token**
3. Create a token with read/write permissions
4. Add it as `DOCKERHUB_TOKEN` in GitHub Secrets

## 🚀 Deployment Flow

The workflow automatically:

1. ✅ Builds Docker image on every push to `main`
2. ✅ Pushes image to Docker Hub
3. ✅ Connects to EC2 via SSH
4. ✅ Pulls latest image
5. ✅ Stops old container
6. ✅ Starts new container with updated image
7. ✅ Configures Nginx (if not already configured)
8. ✅ Sets up SSL with Let's Encrypt (if domain provided)
9. ✅ Runs health check

## 📝 First-Time EC2 Setup

The deployment script will automatically:

- Install Docker and Docker Compose
- Set up Nginx
- Configure firewall rules
- Set up log rotation

**Note:** The first deployment may take longer as it sets up the environment.

## 🌐 Custom Domain Setup

If you want to use a custom domain:

1. Point your domain's A record to your EC2 instance IP
2. Add `DOMAIN` secret with your domain name
3. The workflow will automatically set up SSL with Let's Encrypt

## 💰 Cost Optimization Tips

1. **Use t2.micro/t3.micro instances** (free tier eligible for 12 months)
2. **Use Elastic IP** to avoid IP changes (free if attached to running instance)
3. **Enable CloudWatch monitoring** (free tier: 10 custom metrics)
4. **Use Docker Hub free tier** (1 private repo, unlimited public repos)
5. **Schedule instance stop/start** during low-traffic periods

## 🔍 Troubleshooting

### Deployment fails

1. **Check GitHub Actions logs** for specific errors
2. **SSH into EC2** and check:
   ```bash
   docker ps -a
   docker logs ripple-app
   sudo systemctl status nginx
   ```

### Container not starting

```bash
# Check logs
docker logs ripple-app

# Check environment variables
docker exec ripple-app env

# Restart container
docker restart ripple-app
```

### Nginx not working

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Can't connect to app

1. **Check security group** - ensure ports 80, 443, 4000 are open
2. **Check firewall:**
   ```bash
   sudo ufw status
   ```
3. **Check if container is running:**
   ```bash
   docker ps
   curl http://localhost:4000/api/health
   ```

## 🔄 Manual Deployment

If you need to manually deploy:

```bash
# SSH into EC2
ssh -i ~/.ssh/ripple-ec2-key ubuntu@YOUR_EC2_IP

# Pull latest changes
cd ~/ripple-deploy
./deploy.sh yourusername/ripple-app:latest
```

## 📊 Monitoring

- **Container logs:** `docker logs -f ripple-app`
- **System resources:** `docker stats ripple-app`
- **Nginx access logs:** `sudo tail -f /var/log/nginx/access.log`

## 🔐 Security Best Practices

1. ✅ Use strong JWT secrets (generate with: `openssl rand -hex 32`)
2. ✅ Keep EC2 SSH keys secure and never commit them
3. ✅ Regularly update system packages: `sudo apt update && sudo apt upgrade`
4. ✅ Use security groups to restrict access
5. ✅ Enable AWS CloudTrail for audit logging
6. ✅ Set up automated backups for MongoDB

## 📞 Support

For issues or questions:

1. Check GitHub Actions logs
2. Review deployment scripts in `.github/deploy/`
3. Check Docker and Nginx logs on EC2

---

**Happy Deploying! 🚀**
