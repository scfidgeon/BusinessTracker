# OnSight Mobile App Architecture

## Overview
The OnSight mobile app is built using React Native with Expo to provide a cross-platform application for field service professionals. The app enables users to track their work visits with geolocation precision, manage clients, and generate invoices.

## Technology Stack
- **React Native** - Core framework for building the mobile application
- **Expo** - Development platform for easier React Native development
- **React Navigation** - Navigation library for managing screens and routes
- **Axios** - HTTP client for API communication
- **Expo Location** - For accessing device location services
- **Expo Secure Store** - For secure token storage
- **React Native Maps** - For displaying maps and location information

## Project Structure

```
mobile-app/
├── assets/                  # App assets (icons, splash screens)
├── src/
│   ├── api/                 # API client and services
│   │   └── api.js           # Main API client configuration
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Authentication hook
│   │   └── ...
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.js  # Main navigation structure
│   └── screens/             # App screens
│       ├── HomeScreen.js    # Home screen with location tracking
│       ├── LoginScreen.js   # Authentication screens
│       └── ...
├── App.js                   # Application entry point
├── app.json                 # Expo configuration
└── babel.config.js          # Babel configuration
```

## Architecture Components

### API Layer (src/api/api.js)
- Centralized API client using Axios
- Handles authentication token management
- Organizes API methods into logical groups (auth, clients, visits, invoices)
- Provides consistent error handling

### Authentication (src/hooks/useAuth.js)
- Context-based authentication state management
- Handles user authentication flow (login, register, logout)
- Securely stores authentication tokens using Expo SecureStore
- Provides loading and error states for components

### Navigation (src/navigation/AppNavigator.js)
- Manages application navigation flow
- Implements authenticated and unauthenticated routes
- Uses stack navigation for linear flows (authentication, client details)
- Uses tab navigation for main app sections

### Screens
- **LoginScreen/RegisterScreen** - User authentication
- **HomeScreen** - Main dashboard with location tracking and current visit management
- **ClientsScreen** - Client list and management
- **VisitsScreen** - Visit history and tracking
- **InvoicesScreen** - Invoice management
- **SettingsScreen** - User profile and app settings

## Key Features

### Geolocation Tracking
- Real-time location tracking using Expo Location
- Address resolution from coordinates
- Distance calculation to known client locations
- Visit check-in/check-out based on location

### Authentication
- Secure token-based authentication
- Token persistence between app sessions
- Form validation and error handling

### Offline Support
- Local state management for network interruptions
- Queue system for actions during offline periods (future enhancement)

## Testing on iPhone

### Prerequisites
1. iPhone with iOS 13 or later
2. Expo Go app installed from App Store
3. Mac with Xcode installed (for full testing)
4. Same Wi-Fi network for device and development machine

### Steps to Test
1. Navigate to the mobile-app directory
2. Install dependencies with `npm install`
3. Start the Expo development server with `npm start`
4. Scan the QR code with your iPhone camera
5. The app will open in Expo Go

### Test Credentials
- Username: `demo`
- Password: `password`

## Development Workflow
1. Make changes to the code
2. Expo will automatically reload the app
3. Check console for any errors
4. Use Expo's development tools for debugging

## Future Enhancements
- Offline data synchronization
- Push notifications for client communications
- Enhanced map interfaces with client location markers
- Signature capture for visit verification
- Receipt scanning for expense tracking