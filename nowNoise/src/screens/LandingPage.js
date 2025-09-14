import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
} from 'react-native';

const LandingPage = ({ user, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [spotifyData, setSpotifyData] = useState(null);
  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false);
  const [isLoadingSpotifyData, setIsLoadingSpotifyData] = useState(false);
  
  // New state for music data
  const [playlists, setPlaylists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [timeRange, setTimeRange] = useState('medium_term');

  const API_BASE_URL = 'http://localhost:5000/api';

  // Handle deep linking for Spotify auth
  useEffect(() => {
    const handleDeepLink = (url) => {
      if (url.includes('spotify-success')) {
        Alert.alert('Success', 'Spotify account connected successfully!');
        if (onUserUpdate) {
          // Refresh user data or trigger a re-fetch
        }
      } else if (url.includes('spotify-error')) {
        Alert.alert('Error', 'Failed to connect Spotify account. Please try again.');
      }
      setIsConnectingSpotify(false);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => subscription?.remove();
  }, [onUserUpdate]);

  const handleSpotifyConnect = async () => {
    try {
      setIsConnectingSpotify(true);
      
      const response = await fetch(`${API_BASE_URL}/spotify/auth-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const canOpen = await Linking.canOpenURL(data.auth_url);
        if (canOpen) {
          await Linking.openURL(data.auth_url);
        } else {
          Alert.alert('Error', 'Cannot open Spotify authorization page');
          setIsConnectingSpotify(false);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to connect to Spotify');
        setIsConnectingSpotify(false);
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      setIsConnectingSpotify(false);
    }
  };

  const handleSpotifyDisconnect = async () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/spotify/disconnect`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: user.id
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Spotify account disconnected successfully');
                setSpotifyData(null);
                setPlaylists([]);
                setTopTracks([]);
                setRecentlyPlayed([]);
                setTopArtists([]);
                if (onUserUpdate) {
                  const updatedUser = {
                    ...user,
                    spotify_connected: false,
                    spotify_display_name: null,
                    spotify_profile_image: null
                  };
                  onUserUpdate(updatedUser);
                }
              } else {
                Alert.alert('Error', data.error || 'Failed to disconnect Spotify');
              }
            } catch (error) {
              console.error('Error disconnecting Spotify:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            }
          }
        }
      ]
    );
  };

  const loadSpotifyData = async () => {
    if (!user.spotify_connected) return;

    try {
      setIsLoadingSpotifyData(true);
      
      const response = await fetch(`${API_BASE_URL}/spotify/user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSpotifyData(data.spotify_data);
      } else {
        console.error('Error loading Spotify data:', data.error);
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error);
    } finally {
      setIsLoadingSpotifyData(false);
    }
  };

  // New functions for loading music data
  const loadPlaylists = async () => {
    if (!user.spotify_connected) return;

    try {
      setIsLoadingMusic(true);
      const response = await fetch(`${API_BASE_URL}/spotify/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPlaylists(data.playlists.items || []);
      } else {
        Alert.alert('Error', data.error || 'Failed to load playlists');
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      Alert.alert('Error', 'Network error while loading playlists');
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const loadTopTracks = async () => {
    if (!user.spotify_connected) return;

    try {
      setIsLoadingMusic(true);
      const response = await fetch(`${API_BASE_URL}/spotify/top-tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          time_range: timeRange,
          limit: 20
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTopTracks(data.top_tracks.items || []);
      } else {
        Alert.alert('Error', data.error || 'Failed to load top tracks');
      }
    } catch (error) {
      console.error('Error loading top tracks:', error);
      Alert.alert('Error', 'Network error while loading top tracks');
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const loadRecentlyPlayed = async () => {
    if (!user.spotify_connected) return;

    try {
      setIsLoadingMusic(true);
      const response = await fetch(`${API_BASE_URL}/spotify/recently-played`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          limit: 20
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setRecentlyPlayed(data.recently_played.items || []);
      } else {
        Alert.alert('Error', data.error || 'Failed to load recently played');
      }
    } catch (error) {
      console.error('Error loading recently played:', error);
      Alert.alert('Error', 'Network error while loading recently played');
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const loadTopArtists = async () => {
    if (!user.spotify_connected) return;

    try {
      setIsLoadingMusic(true);
      const response = await fetch(`${API_BASE_URL}/spotify/top-artists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          time_range: timeRange,
          limit: 20
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTopArtists(data.top_artists.items || []);
      } else {
        Alert.alert('Error', data.error || 'Failed to load top artists');
      }
    } catch (error) {
      console.error('Error loading top artists:', error);
      Alert.alert('Error', 'Network error while loading top artists');
    } finally {
      setIsLoadingMusic(false);
    }
  };

  // Load Spotify data when component mounts or when Spotify connection status changes
  useEffect(() => {
    if (user && user.spotify_connected) {
      loadSpotifyData();
    }
  }, [user?.spotify_connected]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const formatDuration = (durationMs) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFollowers = (followers) => {
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`;
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`;
    }
    return followers.toString();
  };

  // Modal rendering functions
  const renderPlaylistModal = () => (
    <Modal
      visible={activeModal === 'playlists'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Your Playlists</Text>
          <TouchableOpacity onPress={() => setActiveModal(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingMusic ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1DB954" size="large" />
            <Text style={styles.loadingText}>Loading playlists...</Text>
          </View>
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.playlistItem}>
                {item.images && item.images.length > 0 && (
                  <Image source={{ uri: item.images[0].url }} style={styles.playlistImage} />
                )}
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.playlistDetails}>
                    {item.tracks.total} tracks • {item.public ? 'Public' : 'Private'}
                  </Text>
                  {item.description && (
                    <Text style={styles.playlistDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderTopTracksModal = () => (
    <Modal
      visible={activeModal === 'topTracks'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Your Top Tracks</Text>
          <TouchableOpacity onPress={() => setActiveModal(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeRangeContainer}>
          {[
            { key: 'short_term', label: '4 Weeks' },
            { key: 'medium_term', label: '6 Months' },
            { key: 'long_term', label: 'All Time' }
          ].map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                timeRange === range.key && styles.activeTimeRange
              ]}
              onPress={() => setTimeRange(range.key)}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === range.key && styles.activeTimeRangeText
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {isLoadingMusic ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1DB954" size="large" />
            <Text style={styles.loadingText}>Loading top tracks...</Text>
          </View>
        ) : (
          <FlatList
            data={topTracks}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item, index }) => (
              <View style={styles.trackItem}>
                <Text style={styles.trackRank}>{index + 1}</Text>
                {item.album && item.album.images && item.album.images.length > 0 && (
                  <Image source={{ uri: item.album.images[0].url }} style={styles.trackImage} />
                )}
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {item.artists.map(artist => artist.name).join(', ')}
                  </Text>
                  <Text style={styles.trackAlbum} numberOfLines={1}>{item.album.name}</Text>
                </View>
                <Text style={styles.trackDuration}>{formatDuration(item.duration_ms)}</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderRecentlyPlayedModal = () => (
    <Modal
      visible={activeModal === 'recentlyPlayed'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Recently Played</Text>
          <TouchableOpacity onPress={() => setActiveModal(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingMusic ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1DB954" size="large" />
            <Text style={styles.loadingText}>Loading recently played...</Text>
          </View>
        ) : (
          <FlatList
            data={recentlyPlayed}
            keyExtractor={(item, index) => `${item.track.id}-${item.played_at}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.trackItem}>
                {item.track.album && item.track.album.images && item.track.album.images.length > 0 && (
                  <Image source={{ uri: item.track.album.images[0].url }} style={styles.trackImage} />
                )}
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName} numberOfLines={1}>{item.track.name}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {item.track.artists.map(artist => artist.name).join(', ')}
                  </Text>
                  <Text style={styles.trackPlayedAt}>
                    {new Date(item.played_at).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.trackDuration}>{formatDuration(item.track.duration_ms)}</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderTopArtistsModal = () => (
    <Modal
      visible={activeModal === 'topArtists'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Your Top Artists</Text>
          <TouchableOpacity onPress={() => setActiveModal(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeRangeContainer}>
          {[
            { key: 'short_term', label: '4 Weeks' },
            { key: 'medium_term', label: '6 Months' },
            { key: 'long_term', label: 'All Time' }
          ].map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                timeRange === range.key && styles.activeTimeRange
              ]}
              onPress={() => setTimeRange(range.key)}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === range.key && styles.activeTimeRangeText
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {isLoadingMusic ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1DB954" size="large" />
            <Text style={styles.loadingText}>Loading top artists...</Text>
          </View>
        ) : (
          <FlatList
            data={topArtists}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item, index }) => (
              <View style={styles.artistItem}>
                <Text style={styles.trackRank}>{index + 1}</Text>
                {item.images && item.images.length > 0 && (
                  <Image source={{ uri: item.images[0].url }} style={styles.artistImage} />
                )}
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.artistFollowers}>
                    {formatFollowers(item.followers.total)} followers
                  </Text>
                  <Text style={styles.artistGenres} numberOfLines={1}>
                    {item.genres.slice(0, 3).join(', ')}
                  </Text>
                </View>
                <Text style={styles.artistPopularity}>{item.popularity}%</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderSpotifySection = () => {
    if (!user?.spotify_connected) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎵 Connect Your Spotify</Text>
          <Text style={styles.cardText}>
            Connect your Spotify account to get personalized music recommendations and sync your playlists.
          </Text>
          <TouchableOpacity
            style={[styles.spotifyButton, isConnectingSpotify && styles.disabledButton]}
            onPress={handleSpotifyConnect}
            disabled={isConnectingSpotify}
          >
            {isConnectingSpotify ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.spotifyButtonText}>Connect Spotify</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎵 Spotify Connected</Text>
        
        {isLoadingSpotifyData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1DB954" size="large" />
            <Text style={styles.loadingText}>Loading Spotify data...</Text>
          </View>
        ) : spotifyData ? (
          <View style={styles.spotifyDataContainer}>
            <View style={styles.spotifyProfile}>
              {spotifyData.images && spotifyData.images.length > 0 && (
                <Image
                  source={{ uri: spotifyData.images[0].url }}
                  style={styles.spotifyProfileImage}
                />
              )}
              <View style={styles.spotifyProfileInfo}>
                <Text style={styles.spotifyDisplayName}>
                  {spotifyData.display_name || 'Spotify User'}
                </Text>
                <Text style={styles.spotifyFollowers}>
                  {spotifyData.followers?.total || 0} followers
                </Text>
                {spotifyData.country && (
                  <Text style={styles.spotifyCountry}>
                    {spotifyData.country}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.spotifyStats}>
              <Text style={styles.cardText}>
                Account Type: {spotifyData.product || 'Free'}
              </Text>
              {spotifyData.email && (
                <Text style={styles.cardText}>
                  Email: {spotifyData.email}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.cardText}>Connected to Spotify</Text>
        )}

        <View style={styles.spotifyActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadSpotifyData}
            disabled={isLoadingSpotifyData}
          >
            <Text style={styles.refreshButtonText}>
              {isLoadingSpotifyData ? 'Loading...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleSpotifyDisconnect}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            
            {renderSpotifySection()}
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back!</Text>
              <Text style={styles.cardText}>
                You're successfully logged in to your account. Here's your dashboard where you can manage your activities.
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Active Projects</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>48</Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>7</Text>
                <Text style={styles.statLabel}>Days Streak</Text>
              </View>
            </View>
          </View>
        );
      
      case 'profile':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>User Information</Text>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Username:</Text>
                <Text style={styles.profileValue}>{user?.username || 'N/A'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Email:</Text>
                <Text style={styles.profileValue}>{user?.email || 'Not provided'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Member since:</Text>
                <Text style={styles.profileValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Spotify:</Text>
                <Text style={[styles.profileValue, user?.spotify_connected ? styles.connectedText : styles.disconnectedText]}>
                  {user?.spotify_connected ? `Connected as ${user.spotify_display_name || 'User'}` : 'Not connected'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Favorite Genres:</Text>
                <Text style={styles.profileValue}>
                  {user?.genres && user.genres.length > 0 ? user.genres.join(', ') : 'None selected'}
                </Text>
              </View>
            </View>
          </View>
        );
      
      case 'music':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Music</Text>
            
            {user?.spotify_connected ? (
              <View>
                {renderSpotifySection()}
                
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Music Features</Text>
                  <Text style={styles.cardText}>
                    With Spotify connected, you can access personalized playlists, discover new music, and sync your listening habits.
                  </Text>
                  
                  <View style={styles.musicFeatures}>
                    <TouchableOpacity 
                      style={styles.featureButton}
                      onPress={() => {
                        setActiveModal('playlists');
                        loadPlaylists();
                      }}
                    >
                      <Text style={styles.featureButtonText}>View Playlists</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.featureButton}
                      onPress={() => {
                        setActiveModal('topTracks');
                        loadTopTracks();
                      }}
                    >
                      <Text style={styles.featureButtonText}>Top Tracks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.featureButton}
                      onPress={() => {
                        setActiveModal('recentlyPlayed');
                        loadRecentlyPlayed();
                      }}
                    >
                      <Text style={styles.featureButtonText}>Recently Played</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.featureButton}
                      onPress={() => {
                        setActiveModal('topArtists');
                        loadTopArtists();
                      }}
                    >
                      <Text style={styles.featureButtonText}>Top Artists</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Connect Spotify to Get Started</Text>
                <Text style={styles.cardText}>
                  Connect your Spotify account to unlock personalized music features, playlist management, and music discovery.
                </Text>
                <TouchableOpacity
                  style={[styles.spotifyButton, isConnectingSpotify && styles.disabledButton]}
                  onPress={handleSpotifyConnect}
                  disabled={isConnectingSpotify}
                >
                  {isConnectingSpotify ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.spotifyButtonText}>Connect Spotify</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      
      case 'settings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>App Preferences</Text>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Notifications</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Privacy</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Account</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Music Settings</Text>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Spotify Connection</Text>
                <Text style={[styles.settingStatus, user?.spotify_connected ? styles.connectedText : styles.disconnectedText]}>
                  {user?.spotify_connected ? 'Connected' : 'Disconnected'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Music Preferences</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hello, {user?.username}!</Text>
          <Text style={styles.headerSubtitle}>Welcome to your dashboard</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'music' && styles.activeTab]}
          onPress={() => setActiveTab('music')}
        >
          <Text style={[styles.tabText, activeTab === 'music' && styles.activeTabText]}>
            Music
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Modals */}
      {renderPlaylistModal()}
      {renderTopTracksModal()}
      {renderRecentlyPlayedModal()}
      {renderTopArtistsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  profileLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  connectedText: {
    color: '#28a745',
  },
  disconnectedText: {
    color: '#dc3545',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 20,
    color: '#999',
  },
  settingStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Spotify-specific styles
  spotifyButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 12,
  },
  spotifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  spotifyDataContainer: {
    marginBottom: 16,
  },
  spotifyProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  spotifyProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  spotifyProfileInfo: {
    flex: 1,
  },
  spotifyDisplayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  spotifyFollowers: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  spotifyCountry: {
    fontSize: 14,
    color: '#666',
  },
  spotifyStats: {
    marginBottom: 16,
  },
  spotifyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  refreshButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  musicFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  featureButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  featureButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  // Time range selector
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  activeTimeRange: {
    backgroundColor: '#1DB954',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: '#ffffff',
  },
  // Playlist item styles
  playlistItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playlistDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  playlistDescription: {
    fontSize: 12,
    color: '#999',
  },
  // Track item styles
  trackItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    width: 30,
    textAlign: 'center',
    marginRight: 12,
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 12,
    color: '#999',
  },
  trackPlayedAt: {
    fontSize: 12,
    color: '#999',
  },
  trackDuration: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  // Artist item styles
  artistItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  artistFollowers: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  artistGenres: {
    fontSize: 12,
    color: '#999',
  },
  artistPopularity: {
    fontSize: 14,
    color: '#1DB954',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default LandingPage;