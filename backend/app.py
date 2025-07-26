from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import re
import os

app = Flask(__name__)

# Get the absolute path to the current directory
basedir = os.path.abspath(os.path.dirname(__file__))

# Create database directory if it doesn't exist
db_dir = os.path.join(basedir, 'database')
os.makedirs(db_dir, exist_ok=True)

# Use absolute path for database
db_path = os.path.join(db_dir, 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-this'

print(f"📁 Database will be created at: {db_path}")

db = SQLAlchemy(app)
CORS(app)  # Enable CORS for React Native

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 6 characters
    return len(password) >= 6

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
        
        print(f"📝 Parsed signup data:")
        print(f"   Username: '{username}' (length: {len(username)})")
        print(f"   Email: '{email}'")
        print(f"   Password: '{password}' (length: {len(password)})")
        
        # Validation with detailed logging
        if not username or len(username) < 3:
            print(f"❌ Username validation failed: '{username}' (length: {len(username)})")
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        
        if not validate_email(email):
            print(f"❌ Email validation failed: '{email}'")
            return jsonify({'error': 'Invalid email format'}), 400
        
        if not validate_password(password):
            print(f"❌ Password validation failed: length {len(password)} (need 6+)")
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
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
            password_hash=password_hash
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        print(f"✅ User created successfully: {username}")
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'created_at': new_user.created_at.isoformat()
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
                'created_at': user.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return jsonify({
            'users': [{
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.isoformat()
            } for user in users]
        })
    except Exception as e:
        print(f"❌ Error getting users: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running!'})

# Debug endpoint to see all users (remove in production)
@app.route('/api/debug/users', methods=['GET'])
def debug_users():
    try:
        users = User.query.all()
        return jsonify({
            'total_users': len(users),
            'database_path': db_path,
            'users': [{
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'password_hash': user.password_hash[:20] + '...',
                'created_at': user.created_at.isoformat()
            } for user in users]
        })
    except Exception as e:
        print(f"❌ Error in debug endpoint: {e}")
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
    print("   GET  /api/debug/users - Debug user info")
    print("🔗 CORS enabled for React Native")
    
    app.run(debug=True, host='0.0.0.0', port=5000)