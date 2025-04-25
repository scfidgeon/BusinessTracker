import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import { visitsAPI } from '../api/api';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [todaysVisits, setTodaysVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Request location permissions and get current location
  const getLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'OnSight needs location access to track your work visits. Please enable it in your device settings.'
        );
        return;
      }
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location.coords);
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (addressResponse && addressResponse.length > 0) {
        const addressData = addressResponse[0];
        const formattedAddress = [
          addressData.street || '',
          addressData.city || '',
          addressData.region || '',
          addressData.postalCode || '',
        ]
          .filter(Boolean)
          .join(', ');
        
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch current visit and today's visits
  const fetchVisitData = async () => {
    try {
      setLoading(true);
      
      // Get current visit if any
      try {
        const visitData = await visitsAPI.getCurrentVisit();
        setCurrentVisit(visitData);
      } catch (error) {
        // If no current visit, the API will return 404, which is fine
        setCurrentVisit(null);
      }
      
      // Get today's visits
      const today = new Date().toISOString().split('T')[0];
      const visits = await visitsAPI.getVisits(today);
      setTodaysVisits(visits || []);
    } catch (error) {
      console.error('Error fetching visit data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Start a new visit
  const startVisit = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Please wait for your location to be determined first');
      return;
    }
    
    try {
      setLoading(true);
      
      const visitData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: address || 'Unknown location',
      };
      
      await visitsAPI.startVisit(visitData);
      
      // Refresh data after starting visit
      await fetchVisitData();
      
      Alert.alert('Success', 'Visit started successfully');
    } catch (error) {
      console.error('Error starting visit:', error);
      Alert.alert('Error', 'Failed to start visit');
    } finally {
      setLoading(false);
    }
  };

  // End the current visit
  const endVisit = async () => {
    if (!currentVisit) {
      Alert.alert('Error', 'No active visit to end');
      return;
    }
    
    try {
      setLoading(true);
      
      await visitsAPI.endVisit(currentVisit.id);
      
      // Refresh data after ending visit
      await fetchVisitData();
      
      Alert.alert('Success', 'Visit ended successfully');
    } catch (error) {
      console.error('Error ending visit:', error);
      Alert.alert('Error', 'Failed to end visit');
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getLocation(), fetchVisitData()]);
    setRefreshing(false);
  };

  // Effect to load initial data
  useEffect(() => {
    getLocation();
    fetchVisitData();
  }, []);

  // Format time from Date object
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate duration in readable format
  const formatDuration = (minutes) => {
    if (!minutes) return 'In progress';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.username || 'User'}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString([], {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="location-on" size={24} color="#4F46E5" />
            <Text style={styles.cardTitle}>Current Location</Text>
          </View>
          
          <View style={styles.locationContainer}>
            {locationLoading ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : currentLocation ? (
              <>
                <Text style={styles.locationAddress}>{address || 'Address not available'}</Text>
                <Text style={styles.locationCoords}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <Text style={styles.errorText}>Location not available</Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.refreshButton} onPress={getLocation}>
            <MaterialIcons name="refresh" size={20} color="#4F46E5" />
            <Text style={styles.refreshText}>Refresh Location</Text>
          </TouchableOpacity>
        </View>

        {/* Current Visit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="clock-o" size={24} color="#4F46E5" />
            <Text style={styles.cardTitle}>Current Visit</Text>
          </View>
          
          {loading ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : currentVisit ? (
            <View style={styles.visitInfo}>
              <Text style={styles.visitLocation}>
                {currentVisit.address || 'Unknown location'}
              </Text>
              <Text style={styles.visitTime}>
                Started at {formatTime(currentVisit.startTime)}
              </Text>
              <TouchableOpacity style={styles.endButton} onPress={endVisit}>
                <MaterialIcons name="stop-circle" size={20} color="#fff" />
                <Text style={styles.endButtonText}>End Visit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noVisitContainer}>
              <Text style={styles.noVisitText}>No active visit</Text>
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={startVisit}
                disabled={!currentLocation || locationLoading}
              >
                <MaterialIcons name="play-circle-outline" size={20} color="#fff" />
                <Text style={styles.startButtonText}>Start Visit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Visits Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="list" size={24} color="#4F46E5" />
            <Text style={styles.cardTitle}>Today's Visits</Text>
          </View>
          
          {loading ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : todaysVisits.length > 0 ? (
            <View style={styles.visitsList}>
              {todaysVisits.map((visit) => (
                <View key={visit.id} style={styles.visitItem}>
                  <View style={styles.visitDetails}>
                    <Text style={styles.visitItemLocation}>{visit.address}</Text>
                    <View style={styles.visitTimings}>
                      <Text style={styles.visitItemTime}>
                        {formatTime(visit.startTime)} - {visit.endTime ? formatTime(visit.endTime) : 'In progress'}
                      </Text>
                      <Text style={styles.visitDuration}>
                        {formatDuration(visit.duration)}
                      </Text>
                    </View>
                  </View>
                  <View 
                    style={[
                      styles.visitStatus, 
                      { backgroundColor: visit.endTime ? '#10B981' : '#4F46E5' }
                    ]}
                  >
                    <Text style={styles.visitStatusText}>
                      {visit.endTime ? 'Completed' : 'Active'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noVisitText}>No visits recorded today</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  date: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationAddress: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    color: '#EF4444',
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  refreshText: {
    marginLeft: 4,
    color: '#4F46E5',
    fontWeight: '500',
  },
  visitInfo: {
    marginBottom: 8,
  },
  visitLocation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  visitTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  endButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  endButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  noVisitContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noVisitText: {
    color: '#6b7280',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    width: '100%',
  },
  startButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  visitsList: {
    marginTop: 8,
  },
  visitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  visitDetails: {
    flex: 1,
  },
  visitItemLocation: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  visitTimings: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitItemTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  visitDuration: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  visitStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  visitStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});