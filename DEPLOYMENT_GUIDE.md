# MILKGLASS MEDIA SERVICES: PRODUCTION DEPLOYMENT RUNBOOK

## Architecture Overview
Milkglass Enterprise Media Services operates on a decoupled Jamstack / Anycast edge static distribution architecture:
- Zero infrastructure maintenance cost tier
- 99.98% SLA edge availability across Cloudflare Global Anycast Edge (300+ PoPs)
- Automatic SSL/TLS certificate management
- Multi-CDN routing and BEP 0009 / BEP 0053 cryptographic manifest distribution

---

## 1. Cloudflare Pages Deployment (Direct Artifact Ingestion)

1. Authenticate to Cloudflare Management Console:
   - Access `https://dash.cloudflare.com`
2. Navigate to **Compute (Workers & Pages)** -> Select **Create Application**.
3. Select **Pages** -> Click **Upload Assets**.
4. Configure application identifier: `milkglass-anime`.
5. Upload directory payload:
   - Target Directory: `C:\Users\mrido\.gemini\antigravity\scratch\milkglass-anime`
6. Execute **Deploy Site**.
   - Edge artifact endpoint will provision at `https://milkglass-anime.pages.dev`.

---

## 2. Custom Domain Provisioning (`milkglass.my.id`)

1. Open project settings in Cloudflare Pages -> Navigate to **Custom domains**.
2. Select **Set up a custom domain**.
3. Specify domain identifier: `milkglass.my.id` (or target subdomain `anime.milkglass.my.id`).
4. Configure DNS routing:
   - **Cloudflare Managed DNS**: Zone routing records configure automatically.
   - **External DNS Authority**: Configure DNS CNAME record:
     - **Record Type:** `CNAME`
     - **Host:** `@` (or subdomain)
     - **Target:** `milkglass-anime.pages.dev`
     - **TTL:** `Auto` (or `3600`)
5. SSL/TLS edge certificate provisions automatically within standard DNS propagation window.

---

## 3. Local Gateway Server Execution

To initialize the development server locally:
```powershell
python "C:\Users\mrido\.gemini\antigravity\scratch\milkglass-anime\serve.py"
```
Access local distribution interface at: `http://localhost:8000`
