import React, { useState, useRef, useEffect } from 'react';
import {
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

const GENRES = [
  { id: 'rock', name: 'Rock', icon: 'musical-notes-outline', color: '#FF6B6B' },
  { id: 'pop', name: 'Pop', icon: 'heart-outline', color: '#4ECDC4' },
  { id: 'hip-hop', name: 'Hip Hop', icon: 'mic-outline', color: '#45B7D1' },
  { id: 'jazz', name: 'Jazz', icon: 'wine-outline', color: '#96CEB4' },
  { id: 'classical', name: 'Classical', icon: 'library-outline', color: '#FFEAA7' },
  { id: 'electronic', name: 'Electronic', icon: 'flash-outline', color: '#DDA0DD' },
  { id: 'country', name: 'Country', icon: 'leaf-outline', color: '#98D8C8' },
  { id: 'r&b', name: 'R&B', icon: 'heart-circle-outline', color: '#F7DC6F' },
  { id: 'reggae', name: 'Reggae', icon: 'sunny-outline', color: '#85C1E9' },
  { id: 'metal', name: 'Metal', icon: 'flame-outline', color: '#F1948A' },
  { id: 'folk', name: 'Folk', icon: 'flower-outline', color: '#D7BDE2' },
  { id: 'blues', name: 'Blues', icon: 'moon-outline', color: '#AED6F1' },
];

const GenreSelectionScreen = ({ onNext, onBack, initialGenres = [] }) => {
  const [selectedGenres, setSelectedGenres] = useState(initialGenres);
  const [error, setError] = useState('');

  const blob1Rotate = useRef(new Animated.Value(0)).current;
  const blob1Morph = useRef(new Animated.Value(0)).current;
  const blob2Rotate = useRef(new Animated.Value(0)).current;
  const blob2Morph = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(blob1Rotate, {
        toValue: 360,
        duration: 35000,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.timing(blob2Rotate, {
        toValue: 360,
        duration: 28000,
        useNativeDriver: false,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Morph, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: false,
        }),
        Animated.timing(blob1Morph, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Morph, {
          toValue: 1,
          duration: 5500,
          useNativeDriver: false,
        }),
        Animated.timing(blob2Morph, {
          toValue: 0,
          duration: 5500,
          useNativeDriver: false,
        }),
      ])
    ).start();
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

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
    if (error) {
      setError('');
    }
  };

  const handleContinue = () => {
    if (selectedGenres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    if (selectedGenres.length > 5) {
      setError('Please select no more than 5 genres');
      return;
    }

    onNext({ genres: selectedGenres });
  };

  const GenreCard = ({ genre, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.genreCard,
        isSelected && styles.genreCardSelected,
        { borderColor: isSelected ? genre.color : 'rgba(139, 92, 246, 0.3)' }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.genreIcon, { backgroundColor: genre.color + '20' }]}>
        <Ionicons 
          name={genre.icon} 
          size={24} 
          color={isSelected ? genre.color : 'rgba(255, 255, 255, 0.7)'} 
        />
      </View>
      <Text style={[
        styles.genreText,
        isSelected && { color: genre.color, fontWeight: '600' }
      ]}>
        {genre.name}
      </Text>
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: genre.color }]}>
          <Ionicons name="checkmark" size={16} color="#ffffff" />
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
              <Stop offset="0%" stopColor="#D41E7F" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#D41E7F" stopOpacity="0.2" />
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
              <Stop offset="0%" stopColor="#781CFF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#781CFF" stopOpacity="0.2" />
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
            <Text style={styles.title}>Choose Genres</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.titleLine} />
          <Text style={styles.subtitle}>Step 2 of 3 - Select your favorite genres</Text>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <Text style={styles.progressText}>
              {selectedGenres.length > 0 && `${selectedGenres.length} selected`}
            </Text>
          </View>

          {/* Genre Grid */}
          <View style={styles.genreGrid}>
            {GENRES.map((genre) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                isSelected={selectedGenres.includes(genre.id)}
                onPress={() => toggleGenre(genre.id)}
              />
            ))}
          </View>

          {/* Error message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedGenres.length === 0 && styles.buttonDisabled
            ]}
            onPress={handleContinue}
            disabled={selectedGenres.length === 0}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonArrow} />
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Select 1-5 genres that best represent your music taste
          </Text>
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
    top: -height * 0.25,
    left: -width * 0.4,
  },
  blob2Container: {
    position: 'absolute',
    bottom: -height * 0.20,
    right: -width * 0.20,
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
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genreCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
  },
  genreCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 2,
    shadowColor: 'rgba(139, 92, 246, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  genreIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  genreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  continueButton: {
    backgroundColor: 'rgba(99, 33, 196, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(129, 57, 238, 0.7)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 35,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 6,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
  },
  buttonArrow: {
    marginLeft: 10,
  },
  helperText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default GenreSelectionScreen;