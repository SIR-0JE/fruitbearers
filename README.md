# 🌿 Fruitbearers Church System
This project is a high-performance **Progressive Web App (PWA)** built with React, Vite, and Supabase. It features an advanced Sermon Player, attendance tracking with PIN/QR, and dynamic church giving.

---

## 🚀 Deployment Options

### 1. **Vercel (Recommended for Members)**
Deploying to Vercel provides a fast, globally-available URL for your church members.

1.  **Connect GitHub**: Push your local code to a GitHub repository.
2.  **Import Project**: In the Vercel Dashboard, click "New Project" and import your repository.
3.  **Configure Environment**: Add your `.env` variables (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
4.  **Deploy**: Vercel will automatically detect the Vite setup and deploy. 

> [!TIP]
> I've already created a `vercel.json` file for you to handle routing correctly.

### 2. **ngrok (Local Testing with Phone)**
This is the best way to test **QR code scanning** on a real phone before a full deployment.

1.  **Start Dev Server**: `npm run dev` (Ensure it's on port 5173).
2.  **Launch Tunnel**: Run `ngrok http 5173` in a new terminal.
3.  **Update Supabase**: Copy the ngrok URL (e.g. `https://xxxx.ngrok-free.app`) and add it to your **Supabase Dashboard -> Auth -> Site URL**.
4.  **Test**: Open the ngrok URL on your smartphone!

---

## 🛠 Troubleshooting
*   **500 Errors on Signup**: If you see a 500 error, disable "Confirm Email" in your Supabase Auth settings unless you have an SMTP email provider configured.
*   **Port in Use**: If port 5173 is busy, Vite will automatically pick another port. Use `taskkill /F /IM node.exe /T` to clear ghost processes.

---

## 👨‍💻 Local Development
```bash
npm install
npm run dev
```
