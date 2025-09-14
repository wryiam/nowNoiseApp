import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import GenStartScreen from './GenStartScreen';

import SignupScreen from './MultiStepSignup';
import TutorialScreen from './TutorialScreen';
import LandingPage from './LandingPage';
import LoginScreen from './LoginScreen';


const AuthScreen = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    console.log('✅ User logged in:', userData);
    setUser(userData);
    setCurrentScreen('landing');
  };

  const handleSignupSuccess = (userData) => {
    console.log('✅ User signed up:', userData);
    setUser(userData);
    setCurrentScreen('tutorial');
  };

  const handleTutorialComplete = () => {
    console.log('✅ Tutorial completed');
    setCurrentScreen('landing');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('welcome');
    console.log('🔓 User logged out');
  };

  const switchToLogin = () => {
    console.log('🔄 Switching to login screen');
    setCurrentScreen('login');
  };

  const switchToSignup = () => {
    console.log('🔄 Switching to signup screen');
    setCurrentScreen('signup');
  };

  // Debug: Log current screen changes
  console.log('Current screen:', currentScreen);

  if (currentScreen === 'landing' && user) {
    return (
      <LandingPage 
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'tutorial' && user) {
    return (
      <TutorialScreen 
        user={user}
        onComplete={handleTutorialComplete}
      />
    );
  }

  if (currentScreen === 'welcome') {
    return (
      <GenStartScreen
        onSwitchToLogin={switchToLogin}
        onSwitchToSignup={switchToSignup}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <LoginScreen
      onSwitchToSignup={switchToSignup}/>
    );
  }

  if (currentScreen === 'signup') {
    return (
      <SignupScreen
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={switchToLogin}
        onBack={() => setCurrentScreen('welcome')}
      />
    );
  }

  // Fallback - should never reach here
  return (
    <GenStartScreen
      onSwitchToLogin={switchToLogin}
      onSwitchToSignup={switchToSignup}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tempScreen: {
    flex: 1,
    backgroundColor: '#2D1B69',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tempTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
  },
  tempButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  tempButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthScreen;