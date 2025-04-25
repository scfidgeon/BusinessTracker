# OnSight iPhone Testing Guide

This guide provides step-by-step instructions for testing the OnSight mobile app on your iPhone using Expo Go.

## Prerequisites

1. iPhone with iOS 13 or later
2. The Expo Go app installed from the App Store
3. Computer with Node.js (v16 or higher) installed
4. Both your iPhone and computer connected to the same WiFi network

## Setup Steps

### 1. Install dependencies

First, make sure all dependencies are installed:

```bash
cd mobile-app
npm install
```

### 2. Find your computer's IP address

Your iPhone needs to know your computer's IP address to connect to the Expo development server.

**On macOS:**
1. Open System Preferences
2. Go to Network
3. Select your active connection (WiFi or Ethernet)
4. Your IP address will be displayed (e.g., 192.168.1.5)

**On Windows:**
1. Open Command Prompt
2. Type `ipconfig` and press Enter
3. Find your active connection (WiFi or Ethernet)
4. Look for "IPv4 Address" (e.g., 192.168.1.5)

**On Linux:**
1. Open Terminal
2. Type `ip addr` or `ifconfig` and press Enter
3. Find your active connection (WiFi or Ethernet)
4. Look for "inet" followed by your IP address (e.g., 192.168.1.5)

### 3. Generate QR Code

There are two ways to generate a QR code:

#### Option 1: Using the command-line tool

Generate a QR code image using the provided utility script:

```bash
# Replace with your actual IP address
npm run qr 192.168.1.5
```

This will generate an `expo-qr.png` file in the mobile-app directory that you can scan with your iPhone's camera.

#### Option 2: Using the in-app QR code screen

1. Start the Expo development server:

```bash
npm start
```

2. Once the server is running, you'll see a QR code in the terminal.

OR

2. Open the OnSight app in Expo Go (after scanning once), tap on the "Connect" tab, and enter your computer's IP address to generate a QR code.

### 4. Connect your iPhone

1. Make sure your iPhone and computer are on the same WiFi network.
2. Open your iPhone camera and point it at the QR code.
3. Tap the banner that appears at the top of your screen.
4. This will open the app in Expo Go.

## Troubleshooting

### Connection Issues

- **Cannot scan QR code**: Make sure the QR code is clearly visible and well-lit.
- **"Cannot connect to server"**: Verify both devices are on the same WiFi network.
- **"Unable to resolve host"**: Double-check your IP address is correct.
- **Firewall issues**: Make sure your computer's firewall allows connections on port 19000.

### App Issues

- **White screen on launch**: The JavaScript bundle might be still loading or there's an error in initialization.
- **Crashing on start**: Check the terminal output for errors and fix them in the code.
- **Location not working**: Make sure you've enabled location services for Expo Go in your iPhone settings.

## Test User Credentials

For testing the app, you can use these credentials:

- **Username**: demo
- **Password**: password

## Updating the App

When you make changes to the code:

1. The Expo development server will automatically rebuild the JavaScript bundle.
2. The app will reload automatically on your iPhone.
3. If the automatic reload doesn't work, you can shake your iPhone to open the Expo developer menu and tap "Reload".

## Feedback

As you test, note any issues or suggestions for improvement:

- UI/UX feedback
- Performance concerns
- Feature requests
- Bug reports

## Next Steps

After completing initial testing, we can:

1. Address any identified issues
2. Implement additional features
3. Refine the UI/UX based on feedback
4. Prepare for App Store submission