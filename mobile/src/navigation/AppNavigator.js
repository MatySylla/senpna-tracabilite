import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import TransfertsScreen from '../screens/TransfertsScreen';
import AlertesScreen from '../screens/AlertesScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#185FA5" />
    </View>
  );

  if (!user) return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ tabBarStyle: { display: 'none' }, headerShown: false }}>
        <Tab.Screen name="Login" component={LoginScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        tabBarActiveTintColor: '#185FA5',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        headerStyle: { backgroundColor: '#185FA5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}>
        <Tab.Screen name="Accueil" component={DashboardScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text> }} />
        <Tab.Screen name="Scanner" component={ScannerScreen}
          options={{ title: 'Verifier QR', tabBarIcon: () => <Text style={{ fontSize: 22 }}>🔍</Text> }} />
        <Tab.Screen name="Transferts" component={TransfertsScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>🔄</Text> }} />
        <Tab.Screen name="Alertes" component={AlertesScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>🔔</Text> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
