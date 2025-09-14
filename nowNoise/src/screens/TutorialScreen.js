import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  PanResponder,
  Image 
} from 'react-native';

const { width, height } = Dimensions.get('window');
const TUTORIAL_SONGS = [
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "Luna Rose",
    album: "Starlight Sessions",
    genre: "Pop",
    duration: "3:24",
    year: "2023",
    coverArt: "https://via.placeholder.com/300x300/8b5cf6/ffffff?text=MD",
  },
  {
    id: 2,
    title: "Electric Waves",
    artist: "Neon Collective",
    album: "Digital Hearts",
    genre: "Electronic",
    duration: "4:12",
    year: "2023",
    coverArt: "https://via.placeholder.com/300x300/d41e7f/ffffff?text=EW",
  },
  {
    id: 3,
    title: "Golden Hour",
    artist: "Sunset Avenue",
    album: "Warm Nights",
    genre: "Indie",
    duration: "3:45",
    year: "2023",
    coverArt: "https://via.placeholder.com/300x300/f59e0b/ffffff?text=GH",
  }
];

const TutorialSongCard = ({ song, style, onSwipeLeft, onSwipeRight, isTop = false, isDemo = false }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(isTop ? 1 : 0.95)).current;
  const opacity = useRef(new Animated.Value(isTop ? 1 : 0.8)).current;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 15;

  const playbackInterval = useRef(null);

  const handlePlayPause = () => {
    if (isDemo) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    } else {
      setIsPlaying(true);
      playbackInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            clearInterval(playbackInterval.current);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, []);

  const animateCard = (direction) => {
    const toValue = direction === 'right' ? width + 100 : -width - 100;
    
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: toValue, y: 0 },
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: direction === 'right' ? 30 : -30,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (direction === 'right') {
        onSwipeRight(song);
      } else {
        onSwipeLeft(song);
      }
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !isDemo,
    onPanResponderMove: (evt, gestureState) => {
      pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      const rotateValue = gestureState.dx * 0.1;
      rotate.setValue(rotateValue);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const swipeThreshold = width * 0.3;
      
      if (gestureState.dx > swipeThreshold) {
        animateCard('right');
      } else if (gestureState.dx < -swipeThreshold) {
        animateCard('left');
      } else {
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-30, 0, 30],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  const progress = (currentTime / totalDuration) * 100;

  return (
    <Animated.View
      style={[
        styles.songCard,
        style,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: rotateInterpolate },
            { scale: scale },
          ],
          opacity: opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: song.coverArt }} style={styles.albumArt} />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{song.artist}</Text>
          <Text style={styles.albumName} numberOfLines={1}>{song.album}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
          </Text>
          <Text style={styles.timeText}>{song.duration}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={handlePlayPause}
          disabled={isDemo}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸️' : '▶️'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.genreBadge}>
        <Text style={styles.genreText}>{song.genre}</Text>
      </View>
    </Animated.View>
  );
};

const TutorialScreen = ({ user, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [songs, setSongs] = useState(TUTORIAL_SONGS);
  const [demoStep, setDemoStep] = useState(0);
  
  const cardAnimations = useRef([
    new Animated.ValueXY(),
    new Animated.Value(0),
  ]).current;

  const tutorialSlides = [
    {
      title: `Welcome ${user?.username || 'User'}! 👋`,
      description: 'Let\'s learn how to discover your perfect songs with our swipe feature.',
      icon: '🎉',
      showCards: false,
      showInstructions: false,
    },
    {
      title: 'Meet Your Song Cards',
      description: 'Each card shows a song recommendation based on your mood and preferences.',
      icon: '🎵',
      showCards: true,
      showInstructions: false,
      isDemo: true,
    },
    {
      title: 'Swipe Right to Like',
      description: 'When you love a song, swipe right or tap the heart to add it to your playlist!',
      icon: '❤️',
      showCards: true,
      showInstructions: true,
      instruction: 'Try swiping right →',
      demoDirection: 'right',
    },
    {
      title: 'Swipe Left to Skip',
      description: 'Not feeling it? Swipe left to discover the next recommendation.',
      icon: '👈',
      showCards: true,
      showInstructions: true,
      instruction: 'Try swiping left ←',
      demoDirection: 'left',
    },
    {
      title: 'You\'re All Set!',
      description: 'Start swiping to build your perfect playlist. The more you swipe, the better we get!',
      icon: '🚀',
      showCards: false,
      showInstructions: false,
    },
  ];

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      if (tutorialSlides[currentSlide + 1].showCards) {
        setSongs([...TUTORIAL_SONGS]);
      }
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      if (tutorialSlides[currentSlide - 1].showCards) {
        setSongs([...TUTORIAL_SONGS]);
      }
    }
  };

  const handleSwipeRight = (song) => {
    setSongs(prev => prev.filter(s => s.id !== song.id));
    setTimeout(() => {
      if (songs.length <= 1) {
        setSongs([...TUTORIAL_SONGS]);
      }
    }, 300);
  };

  const handleSwipeLeft = (song) => {
    setSongs(prev => prev.filter(s => s.id !== song.id));
    setTimeout(() => {
      if (songs.length <= 1) {
        setSongs([...TUTORIAL_SONGS]);
      }
    }, 300);
  };

  useEffect(() => {
    const currentTutorial = tutorialSlides[currentSlide];
    if (currentTutorial.demoDirection && songs.length > 0) {
      const timer = setTimeout(() => {
        const [panAnim, rotateAnim] = cardAnimations;
        const direction = currentTutorial.demoDirection === 'right' ? 1 : -1;
        
        Animated.parallel([
          Animated.timing(panAnim, {
            toValue: { x: direction * width * 0.7, y: 0 },
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: direction * 20,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          panAnim.setValue({ x: 0, y: 0 });
          rotateAnim.setValue(0);
          if (currentTutorial.demoDirection === 'right') {
            handleSwipeRight(songs[0]);
          } else {
            handleSwipeLeft(songs[0]);
          }
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentSlide, songs]);

  const currentTutorial = tutorialSlides[currentSlide];

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.slideContainer}>
          <Text style={styles.icon}>{currentTutorial.icon}</Text>
          <Text style={styles.title}>{currentTutorial.title}</Text>
          <Text style={styles.description}>{currentTutorial.description}</Text>
          
          {currentTutorial.showInstructions && (
            <View style={styles.instructionContainer}>
              <Text style={styles.instruction}>{currentTutorial.instruction}</Text>
            </View>
          )}
        </View>

        {/* Song Cards Demo */}
        {currentTutorial.showCards && (
          <View style={styles.cardsContainer}>
            {songs.slice(0, 2).map((song, index) => (
              <TutorialSongCard
                key={`${song.id}-${currentSlide}`}
                song={song}
                style={[
                  styles.cardStyle,
                  { 
                    zIndex: songs.length - index,
                    top: index * 10,
                  }
                ]}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                isTop={index === 0}
                isDemo={currentTutorial.isDemo}
              />
            ))}
          </View>
        )}

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {tutorialSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={[
            styles.button, 
            styles.secondaryButton,
            currentSlide === 0 && styles.disabledButton
          ]}
          disabled={currentSlide === 0}
        >
          <Text style={[
            styles.buttonText,
            styles.secondaryButtonText,
            currentSlide === 0 && styles.disabledText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={styles.button}>
          <Text style={styles.buttonText}>
            {currentSlide === tutorialSlides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1D55',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1D1D55',
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 100,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContainer: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 10,
  },
  icon: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffffff',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: 320,
  },
  instructionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  instruction: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardsContainer: {
    position: 'relative',
    width: width * 0.85,
    height: 300,
    marginVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStyle: {
    position: 'absolute',
  },
  songCard: {
    width: width * 0.8,
    height: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  albumArt: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 3,
  },
  albumName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    fontSize: 24,
  },
  genreBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.6)',
  },
  genreText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#8b5cf6',
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  button: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
  },
  secondaryButtonText: {
    color: '#8b5cf6',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default TutorialScreen;