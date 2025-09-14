import React, { useState, useRef, useEffect, useCallback } from 'react';
import Logo from '../../assets/images/logo.png'
import { Image } from 'react-native';
import * as Font from 'expo-font';
 
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
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

const FormInput = React.memo(({ 
    placeholder, 
    value, 
    onChangeText, 
    iconName, 
    secureTextEntry = false, 
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    onIconPress,
    showToggle = false,
    error
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
        />
        <TouchableOpacity 
          style={styles.inputIcon}
          onPress={showToggle ? onIconPress : undefined}
          disabled={!showToggle}
          activeOpacity={showToggle ? 0.7 : 1}
        >
          <Ionicons name={iconName} size={20} color="#8b5cf6" />
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  ));

const LoginScreen = ({ onSwitchToLogin, onSwitchToSignup }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const API_BASE_URL = '';
  const blob1Rotate = useRef(new Animated.Value(0)).current;
  const blob1Morph = useRef(new Animated.Value(0)).current;
  
  const blob2Rotate = useRef(new Animated.Value(0)).current;
  const blob2Morph = useRef(new Animated.Value(0)).current;

  const formOpacity = useRef(new Animated.Value(0)).current;
  const formScale = useRef(new Animated.Value(0.9)).current;

 useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'SynBold': require('../../assets/fonts/Syncopate-Bold.ttf'),
          'SynReg': require('../../assets/fonts/Syncopate-Regular.ttf'),
          'Sora': require('../../assets/fonts/Sora-Variable.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Font loading error:', error);
      }
    };
    loadFonts();
  }, []);
  useEffect(() => {
    const rotateBlob1 = () => {
      Animated.loop(
        Animated.timing(blob1Rotate, {
          toValue: 360,
          duration: 30000,
          useNativeDriver: false,
        })
      ).start();
    };

    const rotateBlob2 = () => {
      Animated.loop(
        Animated.timing(blob2Rotate, {
          toValue: 360,
          duration: 25000,
          useNativeDriver: false,
        })
      ).start();
    };

    // Simple morphing
    const morphBlob1 = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob1Morph, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(blob1Morph, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    const morphBlob2 = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob2Morph, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: false,
          }),
          Animated.timing(blob2Morph, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    rotateBlob1();
    rotateBlob2();
    morphBlob1();
    morphBlob2();
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
            transform: [
              { rotate: blob1RotateInterpolate },
            ],
          },
        ]}
      >
        <AnimatedSvg height={1000} width={1200} style={styles.blobSvg} viewBox="0 0 1200 1000">
          <Defs>
            <RadialGradient id="grad1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#D41E7F" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#D41E7F" stopOpacity="0.3" />
            </RadialGradient>
          </Defs>
          <AnimatedPath d={blob1PathInterpolate} fill="url(#grad1)" />
        </AnimatedSvg>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.blob2Container,
          {
            transform: [
              { rotate: blob2RotateInterpolate },
            ],
          },
        ]}
      >
        <AnimatedSvg height={900} width={1100} style={styles.blobSvg} viewBox="0 0 1100 900">
          <Defs>
            <RadialGradient id="grad2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#781CFF" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#781CFF" stopOpacity="0.3" />
            </RadialGradient>
          </Defs>
          <AnimatedPath d={blob2PathInterpolate} fill="url(#grad2)" />
        </AnimatedSvg>
      </Animated.View>
        <Text style={styles.title}>nowNoise</Text>
        <Text style={styles.tagline}>your song, in a day.</Text>
        <Image 
        source={Logo}  
        style={styles.logo}
        />
        <TouchableOpacity 
          style={[styles.buttoned, styles.loginButtoned]}
          onPress={onSwitchToSignup}
        >
        <Text style={styles.loginButtonTexted}>CREATE ACCOUNT</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.buttoned, styles.signupButtoned]}
        onPress={onSwitchToLogin}

  
      >
        <Text style={styles.signupButtonTexted}>LOGIN</Text>
      </TouchableOpacity>

          
 
      <BlurView intensity={80} style={styles.blurOverlay} tint="dark" />

    </View>
  );
};

const styles = StyleSheet.create({
    

buttoned: {
    top: 570,
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 6,
    zIndex: 1000,
    marginRight : 25,
    marginLeft : 25,

  },
  loginButtoned: {
    backgroundColor: 'rgba(99, 33, 196, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(129, 57, 238, 0.5)',
    marginBottom: 20,
    zIndex: 1000,
  },
  signupButtoned: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    zIndex: 1000,
  },
  loginButtonTexted: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 4,
    zIndex: 1000,
  },
  signupButtonTexted: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 4,
    zIndex: 1000,
  },
logo: {
  position: 'absolute',
  top: 100,
  alignSelf: 'center',
  width: 110,
  height: 110, 
  resizeMode: 'contain',
  zIndex: 1000,
},
  
  title: {
    position: 'absolute',
    fontSize: Math.min(width * 0.12, 32),
    fontFamily: 'SynBold',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 150,
    textAlign: 'center',
    letterSpacing: 5,
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    zIndex: 1000,
    top: 230,
    alignSelf: 'center',
  },
  tagline: {
    position: 'absolute',
    top: 270,
    fontSize: Math.min(width * 0.12, 17),
    fontWeight: '300',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    zIndex: 100,
    alignSelf: 'center',
  }, 
  
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
    top: -height * 0.30,
    left: -width * 0.5,
  },
  blob2Container: {
    position: 'absolute',
    bottom: -height * 0.15,
    right: -width * 0.15,
  },
  blobSvg: {
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 15,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: 40,
  },
  
  inputSection: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingRight: 50,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: 1,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  inputIcon: {
    position: 'absolute',
    right: 15,
    top: 18,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 5,
    fontWeight: '500',
  },
  loginButton: {
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
    marginBottom: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  signupLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  testCredentials: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 1,
  },
  testText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
});

export default LoginScreen;