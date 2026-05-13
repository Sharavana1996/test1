// =============================================================================
// APP.JS  —  Navigation setup
// =============================================================================

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { SafeAreaProvider }         from 'react-native-safe-area-context';

import { AppProvider }    from './src/AppContext';
import DashboardScreen    from './src/screens/DashboardScreen';
import PredictScreen      from './src/screens/PredictScreen';
import ImportScreen       from './src/screens/ImportScreen';
import MissingScreen      from './src/screens/MissingScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Dashboard: '📊',
  Predict:   '🤖',
  Import:    '📂',
  Missing:   '🔍',
};

function tabBarIcon(routeName) {
  return TAB_ICONS[routeName] || '•';
}

// Stack wrapper so Dashboard can navigate to Predict / Missing
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Predict"       component={PredictScreen}   options={{ title: 'Predict' }} />
      <Stack.Screen name="Missing"       component={MissingScreen}   options={{ title: 'Missing Cells' }} />
    </Stack.Navigator>
  );
}

const stackOpts = {
  headerStyle:      { backgroundColor: '#0a0a0f', elevation: 0, shadowOpacity: 0 },
  headerTintColor:  '#fff',
  headerTitleStyle: { fontWeight: '700', letterSpacing: 2, fontSize: 14 },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        <NavigationContainer theme={{
          dark: true,
          colors: {
            primary: '#00E5FF', background: '#0a0a0f',
            card: '#0d1117', text: '#fff', border: '#1a1a2e',
            notification: '#FF6B6B',
          },
        }}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: () => null,
              tabBarLabel: `${tabBarIcon(route.name)}  ${route.name}`,
              tabBarStyle:     { backgroundColor: '#0d1117', borderTopColor: '#1a1a2e', height: 60 },
              tabBarLabelStyle:{ fontSize: 11, fontWeight: '700', letterSpacing: 1 },
              tabBarActiveTintColor:   '#00E5FF',
              tabBarInactiveTintColor: '#444',
              headerShown: false,
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Predict"   component={PredictScreen} />
            <Tab.Screen name="Import"    component={ImportScreen} />
            <Tab.Screen name="Missing"   component={MissingScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
