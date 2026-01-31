# 📋 VAL Core Deployment TODO & Review List

**Project:** GM Family Trust - VAL Core  
**Doctrine:** Sovereign Mechanical Truth (TigerBeetle-First)  
**Strategy:** Hybrid (Firebase Frontend + AWS EC2 Backend)  
**Status:** Implementation Ready (Phase 5: Production Launch)

---

## 🏗️ 1. Infrastructure Requirements (For Engineer Review)

### **A. AWS EC2 (The Sovereign Box)**
- **AMI:** Ubuntu 22.04 LTS (x86_64)
- **Instance Type:** `t3.medium` (minimum)
- **Storage:** 30GB GP3 SSD (High-IOPS for TigerBeetle durability)
- **Security Group (Inbound):**
  - SSH (22) from Admin IP
  - API (3001) from Anywhere
  - HTTP/S (80/443) from Anywhere (if using Nginx)
- **Elastic IP:** Assigned to ensure static endpoint for the frontend.

### **B. Firebase (UI Delivery)**
- **Plan:** Spark (Free) or Blaze (Pay-as-you-go)
- **Features:** Firebase Hosting enabled.
- **Domain:** Namecheap domain pointing to Firebase Hosting via TXT/A records.

---

## ✅ 2. Completed Implementation (In Codebase)

- [x] **Dockerfile:** Multi-stage production build for Node.js API.
- [x] **docker-compose.prod.yml:** Orchestration for TigerBeetle, Postgres, and stavomidnite661/val-core-backend.
- [x] **push_to_hub.ps1:** PowerShell script for local build-to-push pipeline.
- [x] **setup_vps.sh:** Shell script for automated AWS EC2 provisioning (Docker/UFW).
- [x] **App.tsx Refactor:** Environment-aware API URL (`VITE_API_URL`).
- [x] **Firebase Manifest:** `firebase.json` and `.firebaserc` configured for `dist/` directory.

---

## 🚀 3. Execution Roadmap (Step-by-Step)

### **Step 1: Local Artifact Creation**
1.  Open PowerShell in `./val-core`.
2.  Run `docker login` (use `stavomidnite661` credentials).
3.  Run `.\push_to_hub.ps1`. This freezes the current code into a Docker image and ships it to Docker Hub.

### **Step 2: AWS Provisioning**
1.  Launch EC2 `t3.medium` with GP3 storage.
2.  Assign Elastic IP.
3.  SSH into instance: `ssh ubuntu@<EC2-IP>`.
4.  Copy `setup_vps.sh` to server and run: `bash setup_vps.sh`.
5.  Create `/opt/sovr-val-core/` and upload `docker-compose.prod.yml`.
6.  Start the stack: `sudo docker compose -f docker-compose.prod.yml up -d`.

### **Step 3: Frontend Deployment**
1.  On local machine, create `.env.production`:
    `VITE_API_URL=http://<YOUR-EC2-IP>:3001/api`
2.  Build: `npm run build`.
3.  Deploy: `firebase deploy`.

---

## 🛡️ 4. Security & Compliance Check
- [ ] **Secrets:** Ensure `ATTESTOR_PRIVATE_KEY` is set on EC2 but never committed to Git.
- [ ] **TigerBeetle:** Verify port `3000` is **NOT** exposed to the public internet.
- [ ] **SSL:** Use Firebase Hosting's auto-SSL for the frontend; consider Nginx + Certbot for the API endpoint if HTTPS is required for the backend.
- [ ] **Truth Check:** Verify `docker-compose.prod.yml` uses persistent volumes for `/data` (TigerBeetle) and `/var/lib/postgresql/data`.

---

## 🛠️ 5. Post-Deployment Verification
- [ ] **Health:** `curl http://<EC2-IP>:3001/api/narrative` should return JSON data.
- [ ] **Ledger:** Run `docker exec sovr_tigerbeetle /tigerbeetle status` to confirm cluster health.
- [ ] **UI:** Access the domain and confirm "Authority Vault" balances match local tests.

---
**Engineer Signature:** _________________________  
**Date:** _________________________
