# Network Testing Setup Guide

## Problem
Images uploaded from other devices aren't visible because the frontend was using hardcoded `localhost` URLs in the admin pages.

## What Was Fixed
I've updated these files to use the environment variable `REACT_APP_API_URL`:
- ✅ `frontend/src/pages/admin/vendorApproval.jsx`
- ✅ `frontend/src/pages/admin/usermanagement.jsx`
- ✅ `frontend/src/components/admin/VendorDetailView.jsx`

## How to Test on Other Devices

### Step 1: Find Your Computer's IP Address

On Windows (Command Prompt):
```bash
ipconfig
```
Look for "IPv4 Address" - it will be something like `192.168.1.4`

Your current IP: **192.168.1.4**

### Step 2: Create `.env` File

Create a file named `.env` in the `frontend` folder with this content:

```env
REACT_APP_API_URL=http://192.168.1.4:3001
```

**Important Notes:**
- Replace `192.168.1.4` with your actual IP address if it's different
- This file is ignored by git (in `.gitignore`) so it won't be committed
- The `.env` file should be in the `frontend` folder (same folder as `package.json`)

### Step 3: Restart Your Development Servers

**Backend:**
1. Stop the backend server (Ctrl+C)
2. Run it again:
   ```bash
   cd backend
   npm start
   ```

**Frontend:**
1. Stop the frontend server (Ctrl+C)
2. Run it again:
   ```bash
   cd frontend
   npm start
   ```

### Step 4: Access from Other Devices

On your phone or other device (on the same WiFi network):

1. Open browser
2. Go to: `http://192.168.1.4:3000` (use YOUR IP address)
3. Login as admin or register as vendor
4. Upload images - they should now be visible!

### Step 5: Backend Configuration (If Needed)

Make sure your backend is accessible from other devices. You might need to:

1. Check if the backend is listening on all interfaces (0.0.0.0) not just localhost
2. Check Windows Firewall settings if connections are blocked

In `backend/src/server.js`, ensure it binds to all interfaces:
```javascript
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

## Testing Checklist

- [ ] Created `.env` file in `frontend` folder
- [ ] Updated `.env` with correct IP address
- [ ] Restarted backend server
- [ ] Restarted frontend server
- [ ] Tested on main computer: http://localhost:3000
- [ ] Tested on other device: http://192.168.1.4:3000
- [ ] Uploaded vendor document on phone
- [ ] Checked if image appears on admin panel on computer
- [ ] Checked if image appears on admin panel on phone

## Common Issues

### Issue: Can't connect from other device
**Solution:** 
- Make sure both devices are on the same WiFi network
- Check Windows Firewall - allow Node.js through firewall
- Try disabling firewall temporarily to test

### Issue: Images still not showing
**Solution:**
- Clear browser cache
- Check browser console for errors (F12)
- Make sure you restarted the frontend after creating `.env`

### Issue: Connection refused
**Solution:**
- Make sure backend is running
- Check if backend is listening on 0.0.0.0 not just 127.0.0.1
- Try accessing directly: http://192.168.1.4:3001/db/health

## For Production

For production deployment, use your actual domain name or server IP:
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

