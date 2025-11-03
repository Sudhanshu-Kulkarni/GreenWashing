import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import ErrorBoundary from './components/ErrorBoundary';
import LoginScreen from './screens/LoginScreen';
import SimpleDashboard from './screens/SimpleDashboard';
import ImportScreen from './screens/ImportScreen';
import HistoryScreen from './screens/HistoryScreen';
import DocumentDetailsScreen from './screens/DocumentDetailsScreen';
import ClaimReviewScreen from './screens/ClaimReviewScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ExportDataScreen from './screens/ExportDataScreen';
import SettingsScreen from './screens/SettingsScreen';
import ReportsListScreen from './screens/ReportsListScreen';
import ClaimsOverviewScreen from './screens/ClaimsOverviewScreen';
import FlaggedClaimsScreen from './screens/FlaggedClaimsScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <ErrorBoundary fallbackMessage="The app encountered an unexpected error. Please restart the app.">
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Dashboard">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Dashboard failed to load.">
                <SimpleDashboard {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="Import">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Import screen failed to load.">
                <ImportScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="History">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="History screen failed to load.">
                <HistoryScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="DocumentDetails">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Document details failed to load.">
                <DocumentDetailsScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="ClaimReview">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Claim review failed to load.">
                <ClaimReviewScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="Processing">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Processing screen failed to load.">
                <ProcessingScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="ExportData">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Export screen failed to load.">
                <ExportDataScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Settings screen failed to load.">
                <SettingsScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="ReportsList">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Reports list failed to load.">
                <ReportsListScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="ClaimsOverview">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Claims overview failed to load.">
                <ClaimsOverviewScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="FlaggedClaims">
            {(props) => (
              <ErrorBoundary navigation={props.navigation} fallbackMessage="Flagged claims failed to load.">
                <FlaggedClaimsScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
