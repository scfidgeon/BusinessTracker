# OnSight Mobile App

A mobile app for field service professionals to track work visits with geolocation.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo Go app installed on your iOS device

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

### Testing on iOS Device

There are two ways to test on your iPhone:

#### Option 1: Using the expo-cli Generated QR Code
1. Make sure your iPhone and computer are on the same WiFi network
2. Install the "Expo Go" app from the App Store on your iPhone
3. Start the app with `npm start`
4. Scan the QR code in terminal with your iPhone camera
5. The app will open in Expo Go

#### Option 2: Using our Custom QR Generator
1. Find your computer's IP address (instructions in IPHONE_TESTING_GUIDE.md)
2. Run the QR generator with your IP address:
```bash
npm run qr 192.168.1.5  # Replace with your actual IP
```
3. This creates an expo-qr.png file you can scan with your iPhone
4. Or use the in-app QR code screen in the "Connect" tab

For detailed setup instructions, see [IPHONE_TESTING_GUIDE.md](./IPHONE_TESTING_GUIDE.md)

### Connecting to Backend

The app is configured to connect to the deployed backend at `https://onsight.replit.app/api`.

For local development:
1. Find your computer's local IP address
2. Update the `API_URL` in `src/api/api.js` to point to your local server:
   ```javascript
   const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
   ```

## Architecture

The OnSight mobile app follows a clean architecture with separation of concerns:

- **API Layer**: Uses axios for backend communication
- **Authentication**: Context-based auth state management 
- **Navigation**: React Navigation for screen management
- **Screens**: Individual UI components for each app section
- **Components**: Reusable UI elements

For more details on the architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## Features

- **Authentication**: Secure login/registration
- **Geolocation**: Real-time location tracking
- **Client Management**: Add, edit, view clients
- **Visit Tracking**: Start/end visits with location verification
- **Invoice Generation**: Create invoices from completed visits
- **Reporting**: View statistics and work history

## Test Credentials

- Username: `demo`
- Password: `password`