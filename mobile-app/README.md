# OnSight Mobile App

A mobile app for field service professionals to track work visits with geolocation.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Expo Go app installed on your iOS device

### Installation

1. Install dependencies:
```
npm install
```

2. Start the Expo development server:
```
npm start
```

### Testing on iOS Device

1. Make sure your iPhone and computer are on the same WiFi network
2. Install the "Expo Go" app from the App Store on your iPhone
3. Start the app with `npm start`
4. Scan the QR code with your iPhone camera
5. The app will open in Expo Go

### Connecting to Backend

The app is configured to connect to the deployed backend at `https://onsight.replit.app/api`.

For local development:
1. Find your computer's local IP address
2. Update the `API_URL` in `src/api/api.js` to point to your local server:
   ```
   const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
   ```

## Features

- Authentication (login/register)
- Real-time geolocation tracking
- Client management
- Visit tracking with automatic location matching
- Invoice generation