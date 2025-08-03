from flask import Flask, request, jsonify, redirect, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
import re
import os
import json
import requests
import urllib.parse
import secrets
import base64

app = Flask(__name__)

# Get the absolute path to the current directory
basedir = os.path.abspath(os.path.dirname(__file__))

# Create database directory if it doesn't exist
db_dir = os.path.join(basedir, 'database')
os.makedirs(db_dir, exist_ok=True)

# Use absolute path for database
db_path = os.path.join(db_dir, 'users.db')
# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Security Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'spotify-oauth-secret-key-change-in-production-' + secrets.token_hex(16))

# Session Configuration for OAuth
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'spotify_oauth:'
app.config['SESSION_COOKIE_NAME'] = 'spotify_session'
app.config['SESSION_COOKIE_DOMAIN'] = None  # Allow localhost
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Spotify Configuration
SPOTIFY_CLIENT_ID = '0e72c394c0bd4e80b930b8a9fd3bf876'  # Replace with your Spotify Client ID
SPOTIFY_CLIENT_SECRET = '4dcaf27a1e9249d1ad9ea6e2514b0ec8'  # Replace with your Spotify Client Secret
SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:5000/api/spotify/callback'
SPOTIFY_SCOPE = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played'

print(f"📁 Database will be created at: {db_path}")

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)  # Enable CORS for React Native with credentials


# Add this after your User class
class SpotifyOAuthState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    state_token = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

    def is_expired(self):
    # Make expires_at timezone-aware if it isn't already
        if self.expires_at.tzinfo is None:
            expires_at_utc = self.expires_at.replace(tzinfo=timezone.utc)
        else:
            expires_at_utc = self.expires_at
        
        return datetime.now(timezone.utc) > expires_at_utc

    def is_valid(self):
        return not self.used and not self.is_expired()

# Updated User model with Spotify fields
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    genres = db.Column(db.Text, nullable=True)  # Store as JSON string
    profile_picture = db.Column(db.String(500), nullable=True)  # Store image URL or path
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    
    # Spotify fields
    spotify_id = db.Column(db.String(120), nullable=True, unique=True)
    spotify_access_token = db.Column(db.Text, nullable=True)
    spotify_refresh_token = db.Column(db.Text, nullable=True)
    spotify_token_expires_at = db.Column(db.DateTime, nullable=True)
    spotify_connected = db.Column(db.Boolean, default=False)
    spotify_display_name = db.Column(db.String(120), nullable=True)
    spotify_email = db.Column(db.String(120), nullable=True)
    spotify_profile_image = db.Column(db.String(500), nullable=True)

    def __repr__(self):
        return f'<User {self.username}>'
    
    def get_genres(self):
        """Convert genres JSON string back to list"""
        if self.genres:
            try:
                return json.loads(self.genres)
            except json.JSONDecodeError:
                return []
        return []
    
    def set_genres(self, genres_list):
        """Convert genres list to JSON string"""
        if genres_list:
            self.genres = json.dumps(genres_list)
        else:
            self.genres = None

    def is_spotify_token_valid(self):
        """Check if Spotify token is still valid"""
        if not self.spotify_token_expires_at:
            return False
        
        # Make spotify_token_expires_at timezone-aware if it isn't already
        if self.spotify_token_expires_at.tzinfo is None:
            expires_at_utc = self.spotify_token_expires_at.replace(tzinfo=timezone.utc)
        else:
            expires_at_utc = self.spotify_token_expires_at
        
        return datetime.now(timezone.utc) < expires_at_utc

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 6 characters
    return len(password) >= 6

def validate_genres(genres):
    """Validate genres list"""
    if not isinstance(genres, list):
        return False
    if len(genres) == 0:
        return False
    if len(genres) > 5:
        return False
    
    # Valid genre IDs (should match your frontend)
    valid_genres = [
        'rock', 'pop', 'hip-hop', 'jazz', 'classical', 'electronic',
        'country', 'r&b', 'reggae', 'metal', 'folk', 'blues'
    ]
    
    for genre in genres:
        if genre not in valid_genres:
            return False
    
    return True

def refresh_spotify_token(user):
    """Refresh Spotify access token using refresh token"""
    if not user.spotify_refresh_token:
        return False
    
    auth_header = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
    
    headers = {
        'Authorization': f'Basic {auth_header}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': user.spotify_refresh_token
    }
    
    try:
        response = requests.post('https://accounts.spotify.com/api/token', headers=headers, data=data)
        if response.status_code == 200:
            token_data = response.json()
            user.spotify_access_token = token_data['access_token']
            user.spotify_token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data['expires_in'])
            
            # Update refresh token if provided
            if 'refresh_token' in token_data:
                user.spotify_refresh_token = token_data['refresh_token']
            
            db.session.commit()
            return True
    except Exception as e:
        print(f"❌ Error refreshing Spotify token: {e}")
    
    return False

def get_spotify_user_data(access_token):
    """Get user data from Spotify API with enhanced error handling"""
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        print(f"🔍 Making request to Spotify API with token: {access_token[:20]}...")
        response = requests.get('https://api.spotify.com/v1/me', headers=headers, timeout=10)
        
        print(f"📊 Spotify API Response Status: {response.status_code}")
        print(f"📊 Spotify API Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Successfully got Spotify user data: {user_data}")
            return user_data
        else:
            print(f"❌ Spotify API Error - Status: {response.status_code}")
            print(f"❌ Response Text: {response.text}")
            
            # Handle specific error cases
            if response.status_code == 401:
                print("❌ Token appears to be invalid or expired")
            elif response.status_code == 403:
                print("❌ Access forbidden - check scopes")
            elif response.status_code == 429:
                print("❌ Rate limited by Spotify")
            
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Timeout error when calling Spotify API")
        return None
    except requests.exceptions.ConnectionError:
        print("❌ Connection error when calling Spotify API")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error when calling Spotify API: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error getting Spotify user data: {e}")
        import traceback
        traceback.print_exc()
        return None
    
@app.route('/api/spotify/playlists', methods=['POST'])
def get_spotify_playlists():
    """Get user's Spotify playlists"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.spotify_connected:
            return jsonify({'error': 'Spotify not connected'}), 400
        
        # Check if token needs refresh
        if not user.is_spotify_token_valid():
            if not refresh_spotify_token(user):
                return jsonify({'error': 'Failed to refresh Spotify token'}), 401
        
        headers = {'Authorization': f'Bearer {user.spotify_access_token}'}
        
        try:
            response = requests.get(
                'https://api.spotify.com/v1/me/playlists?limit=50', 
                headers=headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                playlists_data = response.json()
                return jsonify({'playlists': playlists_data}), 200
            else:
                print(f"❌ Spotify API Error - Status: {response.status_code}")
                return jsonify({'error': 'Failed to fetch playlists'}), 500
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error getting playlists: {e}")
            return jsonify({'error': 'Network error'}), 500
        
    except Exception as e:
        print(f"❌ Error getting Spotify playlists: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/spotify/top-tracks', methods=['POST'])
def get_spotify_top_tracks():
    """Get user's top tracks"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        time_range = data.get('time_range', 'medium_term')  # short_term, medium_term, long_term
        limit = data.get('limit', 20)
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.spotify_connected:
            return jsonify({'error': 'Spotify not connected'}), 400
        
        # Check if token needs refresh
        if not user.is_spotify_token_valid():
            if not refresh_spotify_token(user):
                return jsonify({'error': 'Failed to refresh Spotify token'}), 401
        
        headers = {'Authorization': f'Bearer {user.spotify_access_token}'}
        
        try:
            response = requests.get(
                f'https://api.spotify.com/v1/me/top/tracks?time_range={time_range}&limit={limit}', 
                headers=headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                top_tracks_data = response.json()
                return jsonify({'top_tracks': top_tracks_data}), 200
            else:
                print(f"❌ Spotify API Error - Status: {response.status_code}")
                return jsonify({'error': 'Failed to fetch top tracks'}), 500
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error getting top tracks: {e}")
            return jsonify({'error': 'Network error'}), 500
        
    except Exception as e:
        print(f"❌ Error getting Spotify top tracks: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/spotify/recently-played', methods=['POST'])
def get_spotify_recently_played():
    """Get user's recently played tracks"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        limit = data.get('limit', 20)
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.spotify_connected:
            return jsonify({'error': 'Spotify not connected'}), 400
        
        # Check if token needs refresh
        if not user.is_spotify_token_valid():
            if not refresh_spotify_token(user):
                return jsonify({'error': 'Failed to refresh Spotify token'}), 401
        
        headers = {'Authorization': f'Bearer {user.spotify_access_token}'}
        
        try:
            response = requests.get(
                f'https://api.spotify.com/v1/me/player/recently-played?limit={limit}', 
                headers=headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                recently_played_data = response.json()
                return jsonify({'recently_played': recently_played_data}), 200
            else:
                print(f"❌ Spotify API Error - Status: {response.status_code}")
                return jsonify({'error': 'Failed to fetch recently played tracks'}), 500
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error getting recently played: {e}")
            return jsonify({'error': 'Network error'}), 500
        
    except Exception as e:
        print(f"❌ Error getting Spotify recently played: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/spotify/top-artists', methods=['POST'])
def get_spotify_top_artists():
    """Get user's top artists"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        time_range = data.get('time_range', 'medium_term')  # short_term, medium_term, long_term
        limit = data.get('limit', 20)
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.spotify_connected:
            return jsonify({'error': 'Spotify not connected'}), 400
        
        # Check if token needs refresh
        if not user.is_spotify_token_valid():
            if not refresh_spotify_token(user):
                return jsonify({'error': 'Failed to refresh Spotify token'}), 401
        
        headers = {'Authorization': f'Bearer {user.spotify_access_token}'}
        
        try:
            response = requests.get(
                f'https://api.spotify.com/v1/me/top/artists?time_range={time_range}&limit={limit}', 
                headers=headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                top_artists_data = response.json()
                return jsonify({'top_artists': top_artists_data}), 200
            else:
                print(f"❌ Spotify API Error - Status: {response.status_code}")
                return jsonify({'error': 'Failed to fetch top artists'}), 500
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error getting top artists: {e}")
            return jsonify({'error': 'Network error'}), 500
        
    except Exception as e:
        print(f"❌ Error getting Spotify top artists: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Existing endpoints (signup, login, etc.) remain the same...
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        print(f"📦 Signup - Raw request data: {data}")
        
        if not data:
            print("❌ No data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        genres = data.get('genres', [])
        profile_picture = data.get('profilePicture')
        
        print(f"📝 Parsed signup data:")
        print(f"   Username: '{username}' (length: {len(username)})")
        print(f"   Email: '{email}'")
        print(f"   Password: '{password}' (length: {len(password)})")
        print(f"   Genres: {genres} (count: {len(genres) if genres else 0})")
        print(f"   Profile Picture: {profile_picture[:50] + '...' if profile_picture and len(profile_picture) > 50 else profile_picture}")
        
        # Basic validation
        if not username or len(username) < 3:
            print(f"❌ Username validation failed: '{username}' (length: {len(username)})")
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        
        if not validate_email(email):
            print(f"❌ Email validation failed: '{email}'")
            return jsonify({'error': 'Invalid email format'}), 400
        
        if not validate_password(password):
            print(f"❌ Password validation failed: length {len(password)} (need 6+)")
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Validate genres if provided
        if genres and not validate_genres(genres):
            print(f"❌ Genres validation failed: {genres}")
            return jsonify({'error': 'Invalid genres selection (1-5 valid genres required)'}), 400
        
        print("✅ All signup validations passed!")
        
        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"❌ Username already exists: {username}")
            return jsonify({'error': 'Username already exists'}), 400
        
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print(f"❌ Email already exists: {email}")
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            profile_picture=profile_picture
        )
        
        # Set genres using the helper method
        if genres:
            new_user.set_genres(genres)
        
        db.session.add(new_user)
        db.session.commit()
        
        print(f"✅ User created successfully: {username}")
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'genres': new_user.get_genres(),
                'profile_picture': new_user.profile_picture,
                'created_at': new_user.created_at.isoformat(),
                'spotify_connected': new_user.spotify_connected
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating user: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        print(f"📦 Login - Raw request data: {data}")
        
        if not data:
            print("❌ No login data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        # Can login with either username or email
        login_field = data.get('username', '').strip()  # This could be username or email
        password = data.get('password', '')
        
        print(f"📝 Login attempt:")
        print(f"   Login field: '{login_field}'")
        print(f"   Password: '{password}' (length: {len(password)})")
        
        if not login_field:
            print("❌ No username/email provided")
            return jsonify({'error': 'Username or email is required'}), 400
        
        if not password:
            print("❌ No password provided")
            return jsonify({'error': 'Password is required'}), 400
        
        # Find user by username or email
        user = None
        if validate_email(login_field):
            # It's an email
            user = User.query.filter_by(email=login_field.lower()).first()
            print(f"🔍 Looking for user by email: {login_field.lower()}")
        else:
            # It's a username
            user = User.query.filter_by(username=login_field).first()
            print(f"🔍 Looking for user by username: {login_field}")
        
        if not user:
            print(f"❌ User not found: {login_field}")
            return jsonify({'error': 'Invalid username/email or password'}), 401
        
        # Check password
        if not check_password_hash(user.password_hash, password):
            print(f"❌ Invalid password for user: {user.username}")
            return jsonify({'error': 'Invalid username/email or password'}), 401
        
        print(f"✅ Login successful for user: {user.username}")
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'genres': user.get_genres(),
                'profile_picture': user.profile_picture,
                'created_at': user.created_at.isoformat(),
                'spotify_connected': user.spotify_connected,
                'spotify_display_name': user.spotify_display_name,
                'spotify_profile_image': user.spotify_profile_image
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

# New Spotify Authorization Endpoints
@app.route('/api/spotify/auth-url', methods=['POST'])
def get_spotify_auth_url():
    """Generate Spotify authorization URL"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = db.session.get(User, user_id)  # Fixed SQLAlchemy syntax
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Clean up any existing unused states for this user
        SpotifyOAuthState.query.filter_by(user_id=user_id, used=False).delete()
        
        # Generate a random state parameter for security
        state_token = secrets.token_urlsafe(32)
        
        # Store state in database with 10-minute expiration
        oauth_state = SpotifyOAuthState(
            user_id=user_id,
            state_token=state_token,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        db.session.add(oauth_state)
        db.session.commit()
        
        print(f"🔍 Generated and stored state for user {user_id}: {state_token}")
        
        # Build authorization URL
        params = {
            'response_type': 'code',
            'client_id': SPOTIFY_CLIENT_ID,
            'scope': SPOTIFY_SCOPE,
            'redirect_uri': SPOTIFY_REDIRECT_URI,
            'state': f"{user_id}:{state_token}"  # Include user_id in state
        }
        
        auth_url = 'https://accounts.spotify.com/authorize?' + urllib.parse.urlencode(params)
        
        return jsonify({
            'auth_url': auth_url,
            'state': state_token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error generating Spotify auth URL: {e}")
        return jsonify({'error': 'Internal server error'}), 500
@app.route('/api/spotify/callback', methods=['GET'])
def spotify_callback():
    """Handle Spotify OAuth callback with enhanced debugging"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        print(f"🔍 Callback received:")
        print(f"   Code: {code[:20] + '...' if code else None}")
        print(f"   State: {state}")
        print(f"   Error: {error}")
        
        if error:
            print(f"❌ Spotify authorization error: {error}")
            return redirect('http://localhost:3000/spotify-error')
        
        if not code or not state:
            print("❌ Missing code or state parameter")
            return redirect('http://localhost:3000/spotify-error')
        
        # Extract user_id from state
        try:
            user_id_str, state_token = state.split(':', 1)
            user_id = int(user_id_str)
            print(f"🔍 Extracted user_id: {user_id}, state_token: {state_token}")
        except (ValueError, AttributeError) as e:
            print(f"❌ Invalid state parameter format: {state}. Error: {e}")
            return redirect('http://localhost:3000/spotify-error')
        
        user = db.session.get(User, user_id)
        if not user:
            print(f"❌ User not found: {user_id}")
            return redirect('http://localhost:3000/spotify-error')
        
        # Verify state parameter
        oauth_state = SpotifyOAuthState.query.filter_by(
            user_id=user_id, 
            state_token=state_token, 
            used=False
        ).first()

        if not oauth_state or not oauth_state.is_valid():
            print(f"❌ State validation failed. Invalid or expired state: {state_token}")
            return redirect('http://localhost:3000/spotify-error')

        # Mark state as used
        oauth_state.used = True
        db.session.commit()
                
        print("✅ State validation passed")
        
        # Exchange code for access token
        auth_header = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
        
        headers = {
            'Authorization': f'Basic {auth_header}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': SPOTIFY_REDIRECT_URI
        }
        
        print("🔄 Exchanging code for token...")
        print(f"🔍 Request headers: {headers}")
        print(f"🔍 Request data: {data}")
        
        try:
            response = requests.post('https://accounts.spotify.com/api/token', 
                                   headers=headers, 
                                   data=data, 
                                   timeout=10)
            
            print(f"📊 Token exchange response status: {response.status_code}")
            print(f"📊 Token exchange response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                print(f"❌ Error exchanging code for token: {response.status_code}")
                print(f"❌ Response text: {response.text}")
                return redirect('http://localhost:3000/spotify-error')
            
            token_data = response.json()
            print(f"✅ Token data received: {list(token_data.keys())}")
            
            access_token = token_data['access_token']
            refresh_token = token_data['refresh_token']
            expires_in = token_data['expires_in']
            
            print(f"✅ Token exchange successful - expires in {expires_in} seconds")
            
        except requests.exceptions.Timeout:
            print("❌ Timeout during token exchange")
            return redirect('http://localhost:3000/spotify-error')
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error during token exchange: {e}")
            return redirect('http://localhost:3000/spotify-error')
        
        # Get user data from Spotify with enhanced error handling
        print("🔄 Getting Spotify user data...")
        spotify_user_data = get_spotify_user_data(access_token)
        
        if not spotify_user_data:
            print("❌ Failed to get Spotify user data")
            # Still try to save the tokens even if user data fails
            user.spotify_access_token = access_token
            user.spotify_refresh_token = refresh_token
            user.spotify_token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            user.spotify_connected = True
            db.session.commit()
            print("⚠️ Saved tokens despite user data failure")
            return redirect('http://localhost:3000/spotify-error?reason=user_data_failed')
        
        print(f"✅ Got Spotify user data:")
        print(f"   ID: {spotify_user_data.get('id')}")
        print(f"   Display Name: {spotify_user_data.get('display_name')}")
        print(f"   Email: {spotify_user_data.get('email')}")
        print(f"   Images: {len(spotify_user_data.get('images', []))} image(s)")
        
        # Update user with Spotify data
        user.spotify_id = spotify_user_data['id']
        user.spotify_access_token = access_token
        user.spotify_refresh_token = refresh_token
        user.spotify_token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        user.spotify_connected = True
        user.spotify_display_name = spotify_user_data.get('display_name')
        user.spotify_email = spotify_user_data.get('email')
        
        # Get profile image if available
        if spotify_user_data.get('images') and len(spotify_user_data['images']) > 0:
            user.spotify_profile_image = spotify_user_data['images'][0]['url']
            print(f"✅ Profile image saved: {user.spotify_profile_image}")
        
        db.session.commit()
        
        print(f"✅ Spotify connected successfully for user: {user.username}")
        
        # Redirect back to your app with success
        return redirect('http://localhost:3000/spotify-success')
        
    except Exception as e:
        print(f"❌ Error in Spotify callback: {e}")
        import traceback
        traceback.print_exc()
        return redirect('http://localhost:3000/spotify-error?reason=callback_error')
    
@app.route('/api/spotify/disconnect', methods=['POST'])
def disconnect_spotify():
    """Disconnect Spotify account"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Clear Spotify data
        user.spotify_id = None
        user.spotify_access_token = None
        user.spotify_refresh_token = None
        user.spotify_token_expires_at = None
        user.spotify_connected = False
        user.spotify_display_name = None
        user.spotify_email = None
        user.spotify_profile_image = None
        
        db.session.commit()
        
        return jsonify({'message': 'Spotify account disconnected successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error disconnecting Spotify: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/spotify/user-data', methods=['POST'])
def get_spotify_user_data_endpoint():
    """Get current user's Spotify data"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.spotify_connected:
            return jsonify({'error': 'Spotify not connected'}), 400
        
        # Check if token needs refresh
        if not user.is_spotify_token_valid():
            if not refresh_spotify_token(user):
                return jsonify({'error': 'Failed to refresh Spotify token'}), 401
        
        # Get fresh user data from Spotify
        spotify_data = get_spotify_user_data(user.spotify_access_token)
        if not spotify_data:
            return jsonify({'error': 'Failed to get Spotify data'}), 500
        
        return jsonify({
            'spotify_data': spotify_data,
            'local_data': {
                'spotify_connected': user.spotify_connected,
                'spotify_display_name': user.spotify_display_name,
                'spotify_email': user.spotify_email,
                'spotify_profile_image': user.spotify_profile_image
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting Spotify user data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Existing endpoints remain the same...
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return jsonify({
            'users': [{
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'genres': user.get_genres(),
                'profile_picture': user.profile_picture,
                'created_at': user.created_at.isoformat(),
                'spotify_connected': user.spotify_connected,
                'spotify_display_name': user.spotify_display_name
            } for user in users]
        })
    except Exception as e:
        print(f"❌ Error getting users: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running!'})

@app.route('/api/users/<int:user_id>/profile', methods=['PUT'])
def update_user_profile(user_id):
    try:
        data = request.get_json()
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update genres if provided
        if 'genres' in data:
            genres = data['genres']
            if validate_genres(genres):
                user.set_genres(genres)
            else:
                return jsonify({'error': 'Invalid genres'}), 400
        
        # Update profile picture if provided
        if 'profilePicture' in data:
            user.profile_picture = data['profilePicture']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'genres': user.get_genres(),
                'profile_picture': user.profile_picture,
                'created_at': user.created_at.isoformat(),
                'spotify_connected': user.spotify_connected,
                'spotify_display_name': user.spotify_display_name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating user profile: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask backend server...")
    print(f"📁 Database location: {db_path}")
    
    # Create tables within app context
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully!")
        except Exception as e:
            print(f"❌ Error creating database: {e}")
            print("💡 Try running as administrator or check file permissions")
            exit(1)
    
    print("📍 Health Check: http://localhost:5000/api/health")
    print("📍 API Endpoints:")
    print("   POST /api/signup - Create new user")
    print("   POST /api/login - Login user")
    print("   GET  /api/users - Get all users")
    print("   PUT  /api/users/<id>/profile - Update user profile")
    print("   POST /api/spotify/auth-url - Get Spotify authorization URL")
    print("   GET  /api/spotify/callback - Spotify OAuth callback")
    print("   POST /api/spotify/disconnect - Disconnect Spotify")
    print("   POST /api/spotify/user-data - Get Spotify user data")
    print("🔗 CORS enabled for React Native")
    print("🎵 Spotify integration enabled")
    
    app.run(debug=True, host='0.0.0.0', port=5000)