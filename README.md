# WorkPulse Attendance (PWA)

A lightweight, mobile-first Employee Attendance Marking Progressive Web App (PWA) built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase / Local Offline Adapter**.

---

## 🚀 Core Features

1. **Authentication & Roles**:
   - Simple login portal for **Admin** and **Staff**.
   - One-click instant role-switcher presets for rapid local testing without setup.
   - Ready for Supabase Auth.

2. **Staff Mobile Punch Screen (`/punch`)**:
   - **Live GPS Tracking**: Uses `navigator.geolocation` with high accuracy.
   - **Haversine Distance Geofencing**: Computes distance to office in meters. Blocks punch-in if distance > `radius_meters` with clear visual warning.
   - **Hardware-locked Anti-Spoof Camera Selfie**: Uses `navigator.mediaDevices.getUserMedia` directly to front video stream. Completely removes `<input type="file">` so pre-taken or fake gallery photos cannot be uploaded.
   - **Dynamic Present vs. Late Status**: Checks punch-in time against `shift_start + grace_period_mins`.
   - **Punch Out**: Supports recording departure time and exit GPS coordinates for the day.

3. **Admin Dashboard (`/admin`)**:
   - **Geofence & Grace Period Settings (`/admin/settings`)**: Configure Office Latitude, Longitude, Radius (meters), and Shift Grace Period (minutes). Includes a *"Use My Current Location"* GPS button.
   - **Daily Attendance Monitor (`/admin`)**: Live table of Present, Late, and Absent staff with distance tags, timestamps, and clickable high-res selfie thumbnails.
   - **Monthly CSV Export (`/admin/export`)**: Filter by Month & Year to instantly export clean, formatted attendance sheets.

---

## 🏃 Running the App Locally

Open your terminal in `D:\attendance-pwa` and run:

```bash
npm run dev
```

Then visit:
```
http://localhost:3000
```
On your mobile phone connected to the same Wi-Fi, open:
```
http://<YOUR_PC_IP>:3000
```
*(Tap **"Add to Home Screen"** in Chrome/Safari to install as a standalone mobile app!)*

---

## 🔌 Connecting to Supabase (When Ready)

The app works immediately in **Demo / Local Mode** with zero configuration. When you are ready to connect your cloud Supabase database:

1. Create a free account and new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `D:\attendance-pwa\supabase-setup.sql`, copy all contents, paste it into the SQL Editor, and click **Run**.
4. In Supabase, go to **Project Settings -> API** and copy:
   - Project URL
   - `anon` public key
5. Paste them into `D:\attendance-pwa\.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
6. Restart `npm run dev`. The app will automatically connect to your live Supabase database and upload selfies directly to the `selfies` storage bucket!
