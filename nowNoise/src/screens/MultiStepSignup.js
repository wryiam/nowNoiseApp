import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SignupScreen from './SignupScreen';
import GenreSelectionScreen from './GenreSelectionScreen';
import ProfilePictureScreen from './ProfilePictureScreen';

const MultiStepSignup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    genres: [],
    profilePicture: null,
  });

  const handleStepComplete = (stepData) => {
    setSignupData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onSwitchToLogin();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinalSignup = async (finalData) => {
    const completeSignupData = { ...signupData, ...finalData };
    try {
      const API_BASE_URL = ''; // Replace with your IP
            
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeSignupData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ User created successfully:', data.user);
        setCurrentStep(1);
        setSignupData({
          username: '',
          email: '',
          password: '',
          genres: [],
          profilePicture: null,
        });
        onSignupSuccess(data.user);
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {currentStep === 1 && (
        <SignupScreen
          onSwitchToLogin={onSwitchToLogin}
          onNext={handleStepComplete}
          initialData={signupData}
        />
      )}
      {currentStep === 2 && (
        <GenreSelectionScreen
          onNext={handleStepComplete}
          onBack={handleBack}
          initialGenres={signupData.genres}
        />
      )}
      {currentStep === 3 && (
        <ProfilePictureScreen
          onComplete={handleFinalSignup}
          onBack={handleBack}
          signupData={signupData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MultiStepSignup;