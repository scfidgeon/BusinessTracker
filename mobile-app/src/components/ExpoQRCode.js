import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// This component generates a QR code for Expo Go
export default function ExpoQRCode() {
  const [ipAddress, setIpAddress] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Validate IP address format
  const validateIPAddress = (ip) => {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  // Update QR code when IP address changes
  useEffect(() => {
    const isIPValid = validateIPAddress(ipAddress);
    setIsValid(isIPValid);
    
    if (isIPValid) {
      // Format the Expo URL for QR code
      const expoUrl = `exp://${ipAddress}:19000`;
      setQrValue(expoUrl);
    } else {
      setQrValue('');
    }
  }, [ipAddress]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo QR Code Generator</Text>
      <Text style={styles.instructions}>
        Enter your computer's IP address to generate a QR code for connecting your iPhone to Expo.
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your IP address (e.g., 192.168.1.5)"
          value={ipAddress}
          onChangeText={setIpAddress}
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>
      
      {!isValid && ipAddress !== '' && (
        <Text style={styles.errorText}>
          Please enter a valid IP address
        </Text>
      )}
      
      {isValid && qrValue ? (
        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
            size={200}
            color="#000"
            backgroundColor="#fff"
          />
          <Text style={styles.urlText}>{qrValue}</Text>
          <Text style={styles.scanInstructions}>
            Scan this QR code with your iPhone camera to open in Expo Go
          </Text>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            QR code will appear here
          </Text>
        </View>
      )}
      
      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>How to find your IP address:</Text>
        <Text style={styles.helpText}>• Windows: Open Command Prompt and type "ipconfig"</Text>
        <Text style={styles.helpText}>• Mac: Go to System Preferences → Network</Text>
        <Text style={styles.helpText}>• Linux: Open Terminal and type "ip addr" or "ifconfig"</Text>
        <Text style={styles.noteText}>
          Note: Make sure your iPhone and computer are on the same WiFi network
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4F46E5',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6b7280',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 15,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  urlText: {
    marginTop: 15,
    fontSize: 16,
    color: '#4F46E5',
  },
  scanInstructions: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6b7280',
  },
  placeholderContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  helpContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 10,
  },
  helpTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  helpText: {
    marginBottom: 5,
    color: '#4b5563',
  },
  noteText: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#4b5563',
  },
});