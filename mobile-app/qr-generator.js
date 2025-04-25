#!/usr/bin/env node

/**
 * OnSight Expo QR Code Generator
 * 
 * This script generates a QR code for connecting to the Expo development server
 * from your iOS device using the Expo Go app.
 * 
 * Usage:
 * - Make sure to run 'npm install' first to install dependencies
 * - Then run 'node qr-generator.js <YOUR_IP_ADDRESS>'
 * 
 * Example: node qr-generator.js 192.168.1.5
 */

const QRCode = require('qrcode');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
let ipAddress = args[0];

// If no IP address was provided, try to get the local IP address
if (!ipAddress) {
  const networks = os.networkInterfaces();
  const networkValues = Object.values(networks)
    .flat()
    .filter(details => details.family === 'IPv4' && !details.internal);
  
  if (networkValues.length > 0) {
    ipAddress = networkValues[0].address;
  }
}

if (!ipAddress) {
  console.error('Error: Could not determine IP address. Please provide it as an argument.');
  console.error('Usage: node qr-generator.js <YOUR_IP_ADDRESS>');
  process.exit(1);
}

// Validate IP address format
const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
if (!ipRegex.test(ipAddress)) {
  console.error('Error: Invalid IP address format.');
  console.error('Usage: node qr-generator.js <YOUR_IP_ADDRESS>');
  process.exit(1);
}

// Create the Expo URL
const expoUrl = `exp://${ipAddress}:19000`;
const outputFile = path.join(__dirname, 'expo-qr.png');

// Generate the QR code
QRCode.toFile(
  outputFile, 
  expoUrl,
  {
    color: {
      dark: '#4F46E5',  // Blue dots
      light: '#FFFFFF'  // White background
    },
    width: 400,
    margin: 2,
  },
  (err) => {
    if (err) {
      console.error('Error generating QR code:', err);
      process.exit(1);
    }
    
    console.log('');
    console.log('✅ QR Code generated successfully!');
    console.log('');
    console.log(`📱 Scan with your iPhone to open OnSight in Expo Go`);
    console.log(`📍 IP Address: ${ipAddress}`);
    console.log(`🔗 Expo URL: ${expoUrl}`);
    console.log(`📄 QR Code saved to: ${outputFile}`);
    console.log('');
    console.log('Make sure:');
    console.log('1. Your iPhone and computer are on the same WiFi network');
    console.log('2. You have the Expo Go app installed on your iPhone');
    console.log('3. You\'ve run "npm install" and "npm start" in the mobile-app directory first');
    console.log('');
  }
);