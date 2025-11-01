# 🔐 GitHub Secrets Quick Setup Guide

## Required Secrets (Must Have)

Copy and paste these into your GitHub repository settings:

### 1. EC2 Connection Secrets
```
EC2_HOST = your-ec2-ip-or-domain.com
EC2_USER = ubuntu
EC2_SSH_KEY = -----BEGIN RSA PRIVATE KEY-----
[Your full private key here]
-----END RSA PRIVATE KEY-----
EC2_PORT = 22
```

### 2. Docker Hub Secrets
```
DOCKERHUB_USERNAME = your-dockerhub-username
DOCKERHUB_TOKEN = dckr_pat_your_token_here
```

### 3. Application Secrets
```
MONGO_URI = mongodb+srv://user:password@cluster.mongodb.net/ripple
JWT_SECRET = [Generate with: openssl rand -hex 32]
CLIENT_URL = https://yourdomain.com
```

### 4. Razorpay Secrets
```
RAZORPAY_KEY_ID = rzp_test_xxxxx
RAZORPAY_KEY_SECRET = your_secret_key
RAZORPAY_WEBHOOK_SECRET = your_webhook_secret
```

## Optional Secrets

```
DOMAIN = yourdomain.com          # For automatic SSL setup
OPENAI_API_KEY = sk-xxxxx        # For AI features
```

## Quick Setup Commands

### Generate JWT Secret
```bash
openssl rand -hex 32
```

### Generate SSH Key Pair
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/ripple-ec2 -N ""
cat ~/.ssh/ripple-ec2  # Copy this for EC2_SSH_KEY
```

### Get Docker Hub Token
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it "github-actions"
4. Copy the token

---

**After adding all secrets, push to main branch to trigger deployment! 🚀**

