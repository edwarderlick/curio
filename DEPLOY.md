# Deploying Curio — app on Vercel, server on a free Oracle Cloud VM

Two pieces, two hosts, both free:

- **`app/`** (the React/Vite frontend) → **Vercel**. Static hosting is exactly what Vercel is built for.
- **`server/`** (Express + real ffmpeg transcode + Shelby uploads) → an **Oracle Cloud "Always Free" VM**. It needs a persistent process, a real `ffmpeg` binary, and disk that survives restarts — none of which Vercel's serverless functions provide, and none of which cost anything on Oracle's Always Free tier.

They talk to each other over HTTPS via `VITE_API_BASE_URL` — no shared origin needed.

---

## Part A — Server on Oracle Cloud

### A1. Create the VM

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) (a card is required for identity verification, but the Always Free resources themselves are never billed).
2. Create a Compute instance:
   - Image: **Ubuntu 22.04**
   - Shape: pick from the **Always Free** eligible list (the Ampere A1 ARM shape, e.g. 2 OCPU / 12GB, is usually the most generous free allowance; the AMD `VM.Standard.E2.1.Micro` also works if A1 isn't available in your region).
   - Add your SSH key (or let Oracle generate one for you to download).
3. Note the VM's **public IP address** once it's running.

### A2. Open the firewall — two layers, both required

Oracle blocks traffic at the cloud level *and* the VM ships with its own `iptables` rules. Both need opening or nothing gets through:

- In the OCI console: your instance → **Subnet** → **Security List** → add ingress rules for TCP `22`, `80`, `443` from `0.0.0.0/0`.
- On the VM itself, after SSHing in:
  ```bash
  sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
  sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
  sudo netfilter-persistent save
  ```

### A3. Install Docker

```bash
ssh ubuntu@<VM_PUBLIC_IP>
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

### A4. Get the code and your Shelby credentials onto the VM

```bash
git clone https://github.com/<you>/<repo>.git curio
```

Your Shelby signing account lives in `~/.shelby/config.yaml` on *your* machine (created back in Setup step 3) — the server reads it by account name, and there's a real private key in there, so copy it over `scp`, not git:

```bash
# from your local machine, not the VM
scp -r ~/.shelby ubuntu@<VM_PUBLIC_IP>:~/.shelby
```

### A5. Configure environment variables

```bash
cd ~/curio/server
cp .env.example .env
nano .env   # fill in real values — same ones as your local server/.env,
            # except CORS_ORIGIN: leave it blank for now, you'll set it
            # once you know your Vercel URL (Part C)
```

### A6. Build and run

The container needs two things mounted from the host: `data/` (so the catalog and thumbnails survive restarts/redeploys) and `.shelby/` (your signing account):

```bash
docker build -t curio-server .
docker run -d --name curio-server \
  --restart unless-stopped \
  -p 127.0.0.1:8787:8787 \
  --env-file .env \
  -v ~/curio/server/data:/app/data \
  -v ~/.shelby:/root/.shelby:ro \
  curio-server
```

Note `127.0.0.1:8787` — the container is *not* exposed directly to the internet. Caddy (next step) is the only thing that talks to the outside world, and it terminates HTTPS before forwarding to the container. Verify it's up:

```bash
curl http://127.0.0.1:8787/api/catalog/lectures
```

**Check ffmpeg actually satisfies the app's own version check** (I couldn't run a live Docker build to verify this myself — the Dockerfile pulls a static ffmpeg build specifically because Debian's own `apt install ffmpeg` ships a version too old for this app's `v7+` requirement, but confirm it on your VM):

```bash
docker exec curio-server ffmpeg -version | head -1
```
If that doesn't print a `7.x` (or newer) version, the static-build download in the Dockerfile may have failed silently or johnvansickle.com's URL structure may have changed — check the build logs from `docker build` for errors around the `curl`/`tar` step.

### A7. Free HTTPS with Caddy — no domain purchase needed

Browsers block a Vercel page (HTTPS) from calling an HTTP-only API (mixed content), so the server needs a real TLS certificate. You don't need to buy a domain for this: **sslip.io** gives you a free hostname that resolves to any IP automatically — `<your-ip-with-dashes>.sslip.io` always resolves to `<your-ip>`. Caddy uses that to get a real Let's Encrypt certificate automatically.

If your VM's IP is `141.147.1.2`, your hostname is `141-147-1-2.sslip.io`.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

echo '141-147-1-2.sslip.io {
    reverse_proxy 127.0.0.1:8787
}' | sudo tee /etc/caddy/Caddyfile   # replace with your actual IP-based hostname

sudo systemctl restart caddy
```

Caddy fetches and renews the certificate automatically. Your server is now live at `https://141-147-1-2.sslip.io` (use your real hostname).

Test it: `curl https://141-147-1-2.sslip.io/api/catalog/lectures` should return your catalog JSON.

---

## Part B — Frontend on Vercel

1. Push this repo to GitHub if you haven't already (see the main setup notes — `git init`/commit is already done locally).
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Set **Root Directory** to `app`. Vercel should auto-detect Vite (build command `npm run build`, output `dist`) — `app/vercel.json` already has this configured too.
4. Add environment variables (Project Settings → Environment Variables) — same values as your local `app/.env`, plus the new one pointing at your server:
   ```
   VITE_SHELBY_NETWORK=shelbynet
   VITE_SHELBY_RPC_ENDPOINT=https://api.shelbynet.shelby.xyz/shelby
   VITE_APTOS_FULLNODE=https://api.shelbynet.shelby.xyz/v1
   VITE_APTOS_INDEXER=https://api.shelbynet.shelby.xyz/v1/graphql
   VITE_SHELBY_API_KEY=<your real geomi.dev key>
   VITE_API_BASE_URL=https://141-147-1-2.sslip.io
   ```
5. Deploy.

---

## Part C — Close the loop: lock down CORS

Now that you know your real Vercel URL (e.g. `https://curio-yourname.vercel.app`), go back to the server and restrict CORS to it instead of leaving it wide open:

```bash
# on the VM
cd ~/curio/server
nano .env   # set CORS_ORIGIN=https://curio-yourname.vercel.app
docker restart curio-server
```

---

## Verifying it actually works

- [ ] `https://<vercel-url>/explore` shows real lectures (catalog reads reach the server)
- [ ] Connect a wallet, click **Get testnet funds** — works client-side, unaffected by any of this
- [ ] Publish a short test lecture through the Studio upload wizard — this is the slow, real-ffmpeg path; give it time
- [ ] Buy/unlock a lecture, confirm it plays
- [ ] Check the browser console for CORS or mixed-content errors — if you see any, re-check Part C and that `VITE_API_BASE_URL` is the `https://` sslip.io URL, not `http://`

## Redeploying after code changes

- **App**: just `git push` — Vercel redeploys automatically.
- **Server**: `git pull && docker build -t curio-server . && docker stop curio-server && docker rm curio-server` then re-run the `docker run` command from A6 (the `-v` mounts mean your catalog data and Shelby credentials survive the rebuild).
