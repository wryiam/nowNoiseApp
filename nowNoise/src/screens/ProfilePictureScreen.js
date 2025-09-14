import React, { useState, useRef, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Dimensions,
} from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const BLOB_PATHS = {
  blob1: {
    start: 'M400,300 C550,120 800,160 900,300 C1000,440 850,640 700,680 C550,720 400,600 300,480 C200,360 250,480 400,300 Z',
    end: 'M400,300 C620,80 760,200 900,300 C1040,400 880,600 760,720 C640,840 480,720 320,600 C160,480 180,520 400,300 Z',
  },
  blob2: {
    start: 'M320,240 C480,80 720,120 840,240 C960,360 880,560 720,640 C560,720 400,640 280,520 C160,400 160,400 320,240 Z',
    end: 'M320,240 C440,40 760,160 840,240 C920,320 820,520 700,600 C580,680 340,620 220,500 C100,380 200,440 320,240 Z',
  },
};

// Default avatar options
const DEFAULT_AVATARS = [
  { id: 1, source: 'https://i.pravatar.cc/150?img=1', name: 'Avatar 1' },
  { id: 2, source: 'https://i.pravatar.cc/150?img=2', name: 'Avatar 2' },
  { id: 3, source: 'https://i.pravatar.cc/150?img=3', name: 'Avatar 3' },
  { id: 4, source: 'https://i.pravatar.cc/150?img=4', name: 'Avatar 4' },
  { id: 5, source: 'https://i.pravatar.cc/150?img=5', name: 'Avatar 5' },
  { id: 6, source: 'https://i.pravatar.cc/150?img=6', name: 'Avatar 6' },
  { id: 7, source: 'https://i.pravatar.cc/150?img=7', name: 'Avatar 7' },
  { id: 8, source: 'https://i.pravatar.cc/150?img=8', name: 'Avatar 8' },
];

const ProfilePictureScreen = ({ onComplete, onBack, signupData }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [customImage, setCustomImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation refs
  const blob1Rotate = useRef(new Animated.Value(0)).current;
  const blob1Morph = useRef(new Animated.Value(0)).current;
  const blob2Rotate = useRef(new Animated.Value(0)).current;
  const blob2Morph = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formScale = useRef(new Animated.Value(0.9)).current;

  // Animation setup
  useEffect(() => {
    // Blob rotations
    Animated.loop(
      Animated.timing(blob1Rotate, {
        toValue: 360,
        duration: 40000,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.timing(blob2Rotate, {
        toValue: 360,
        duration: 32000,
        useNativeDriver: false,
      })
    ).start();

    // Blob morphing
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Morph, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }),
        Animated.timing(blob1Morph, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Morph, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: false,
        }),
        Animated.timing(blob2Morph, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Form entrance
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(formScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Interpolated values
  const blob1RotateInterpolate = blob1Rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const blob2RotateInterpolate = blob2Rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const blob1PathInterpolate = blob1Morph.interpolate({
    inputRange: [0, 1],
    outputRange: [BLOB_PATHS.blob1.start, BLOB_PATHS.blob1.end],
  });

  const blob2PathInterpolate = blob2Morph.interpolate({
    inputRange: [0, 1],
    outputRange: [BLOB_PATHS.blob2.start, BLOB_PATHS.blob2.end],
  });

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Media library permission denied');
    }
  };

  const selectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    setCustomImage(null);
    setError('');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCustomImage(result.assets[0]);
        setSelectedAvatar(null);
        setError('');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCustomImage(result.assets[0]);
        setSelectedAvatar(null);
        setError('');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleComplete = async () => {
    if (!selectedAvatar && !customImage) {
      setError('Please select a profile picture');
      return;
    }

    setLoading(true);

    try {
      const profilePicture = customImage ? customImage.uri : selectedAvatar.source;
      
      // Complete the signup process
      await onComplete({
        profilePicture: profilePicture,
      });
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipProfilePicture = async () => {
    setLoading(true);
    try {
      await onComplete({
        profilePicture: null,
      });
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentProfilePicture = () => {
    if (customImage) return customImage.uri;
    if (selectedAvatar) return selectedAvatar.source;
    return null;
  };

  const AvatarOption = ({ avatar, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.avatarOption,
        isSelected && styles.avatarOptionSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: avatar.source }} style={styles.avatarImage} />
      {isSelected && (
        <View style={styles.avatarCheckmark}>
          <Ionicons name="checkmark" size={20} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background Effects */}
      <View style={styles.noiseOverlay}>
        <View style={styles.noisePattern} />
        <View style={styles.noisePattern2} />
        <View style={styles.noisePattern3} />
      </View>

      {/* Animated Blobs */}
      <Animated.View
        style={[
          styles.blob1Container,
          {
            transform: [{ rotate: blob1RotateInterpolate }],
          },
        ]}
      >
        <AnimatedSvg height={1000} width={1200} style={styles.blobSvg} viewBox="0 0 1200 1000">
          <Defs>
            <RadialGradient id="grad1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#D41E7F" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#D41E7F" stopOpacity="0.1" />
            </RadialGradient>
          </Defs>
          <AnimatedPath d={blob1PathInterpolate} fill="url(#grad1)" />
        </AnimatedSvg>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.blob2Container,
          {
            transform: [{ rotate: blob2RotateInterpolate }],
          },
        ]}
      >
        <AnimatedSvg height={900} width={1100} style={styles.blobSvg} viewBox="0 0 1100 900">
          <Defs>
            <RadialGradient id="grad2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#781CFF" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#781CFF" stopOpacity="0.1" />
            </RadialGradient>
          </Defs>
          <AnimatedPath d={blob2PathInterpolate} fill="url(#grad2)" />
        </AnimatedSvg>
      </Animated.View>

      <BlurView intensity={80} style={styles.blurOverlay} tint="dark" />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: formOpacity,
              transform: [{ scale: formScale }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Profile Picture</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.titleLine} />
          <Text style={styles.subtitle}>Step 3 of 3 - Choose your profile picture</Text>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>

          {/* Current Profile Picture Preview */}
          <View style={styles.previewContainer}>
            <View style={styles.previewCircle}>
              {getCurrentProfilePicture() ? (
                <Image 
                  source={{ uri: getCurrentProfilePicture() }} 
                  style={styles.previewImage} 
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Ionicons name="person-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
                </View>
              )}
            </View>
            <Text style={styles.previewText}>
              {getCurrentProfilePicture() ? 'Looking great!' : 'No picture selected'}
            </Text>
          </View>

          {/* Camera Options */}
          <View style={styles.cameraOptions}>
            <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color="#8b5cf6" />
              <Text style={styles.cameraButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#8b5cf6" />
              <Text style={styles.cameraButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or choose a default</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Default Avatar Options */}
          <View style={styles.avatarGrid}>
            {DEFAULT_AVATARS.map((avatar) => (
              <AvatarOption
                key={avatar.id}
                avatar={avatar}
                isSelected={selectedAvatar?.id === avatar.id}
                onPress={() => selectAvatar(avatar)}
              />
            ))}
          </View>

          {/* Error message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.completeButton, loading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={loading || (!selectedAvatar && !customImage)}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.completeButtonText}>CREATE ACCOUNT</Text>
                  <Ionicons name="checkmark" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.skipButton, loading && styles.buttonDisabled]}
              onPress={skipProfilePicture}
              disabled={loading}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          {/* User info summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Account Summary:</Text>
            <Text style={styles.summaryText}>Username: {signupData.username}</Text>
            <Text style={styles.summaryText}>Email: {signupData.email}</Text>
            <Text style={styles.summaryText}>
              Genres: {signupData.genres?.length || 0} selected
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1D55',
    position: 'relative',
    overflow: 'hidden',
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 1,
  },
  noisePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    transform: [{ scale: 1.1 }],
  },
  noisePattern2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.02)',
    transform: [{ scale: 0.9 }, { rotate: '45deg' }],
  },
  noisePattern3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(236, 72, 153, 0.01)',
    transform: [{ scale: 1.2 }, { rotate: '-30deg' }],
  },
  blob1Container: {
    position: 'absolute',
    top: -height * 0.20,
    left: -width * 0.3,
  },
  blob2Container: {
    position: 'absolute',
    bottom: -height * 0.25,
    right: -width * 0.25,
  },
  blobSvg: {},
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 15,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25,
    padding: 30,
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    flex: 1,
  },
  titleLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#8b5cf6',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  previewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  cameraOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cameraButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginHorizontal: 15,
    fontWeight: '500',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarOption: {
    width: (width - 120) / 4,
    height: (width - 120) / 4,
    borderRadius: (width - 120) / 8,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: '#8b5cf6',
    borderWidth: 3,
    shadowColor: 'rgba(139, 92, 246, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarCheckmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  actionButtons: {
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: 'rgba(99, 33, 196, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(129, 57, 238, 0.8)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 35,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: 'rgba(139, 92, 246, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 6,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
  },
  summaryText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
});

export default ProfilePictureScreen;