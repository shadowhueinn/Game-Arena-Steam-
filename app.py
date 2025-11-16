from flask import Flask, send_from_directory, abort, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import sys
from datetime import datetime


try:
    ROOT = os.path.dirname(os.path.abspath(__file__))
except NameError:
    ROOT = os.path.abspath(os.getcwd())


def create_app():
    try:
        # Create Flask app
        app = Flask(__name__, static_folder=None)
        app.secret_key = 'your_secret_key_here'  # Change to a secure key
        
        # Configure SQLAlchemy
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(ROOT, 'steamclone.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        return app
    except Exception as e:
        print(f"Error creating Flask app: {e}")
        sys.exit(1)

app = create_app()
db = SQLAlchemy(app)



class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userName = db.Column(db.String(120), nullable=False)
    userFirstName = db.Column(db.String(120), nullable=False)
    userLastName = db.Column(db.String(120), nullable=False)
    DateOfBirth = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    fileData = db.Column(db.Text, nullable=True)
    password_hash = db.Column(db.String(200), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'userName': self.userName,
            'userFirstName': self.userFirstName,
            'userLastName': self.userLastName,
            'DateOfBirth': self.DateOfBirth,
            'email': self.email,
            'fileData': self.fileData,
        }

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(300), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'category': self.category,
            'image': self.image,
        }

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='comments')
    game = db.relationship('Game', backref='comments')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'text': self.text,
            'timestamp': self.timestamp.isoformat(),
            'user_name': self.user.userName,
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'text': self.text,
            'timestamp': self.timestamp.isoformat(),
            'sender_name': self.sender.userName,
            'receiver_name': self.receiver.userName,
        }

class SharedGame(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    shared_with_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref='shared_games')
    game = db.relationship('Game', backref='shared_games')
    shared_with_user = db.relationship('User', foreign_keys=[shared_with_user_id], backref='received_shared_games')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'shared_with_user_id': self.shared_with_user_id,
            'timestamp': self.timestamp.isoformat(),
            'user_name': self.user.userName,
            'game_name': self.game.name,
            'shared_with_name': self.shared_with_user.userName,
        }

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow)
    installed = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='purchases')
    game = db.relationship('Game', backref='purchases')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'purchase_date': self.purchase_date.isoformat(),
            'installed': self.installed,
            'user_name': self.user.userName,
            'game_name': self.game.name,
            'game_price': self.game.price,
            'game_image': self.game.image,
        }

def init_db():
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
            
            # Create default admin user if it doesn't exist
            admin_exists = User.query.filter_by(userName='admin').first()
            if not admin_exists:
                admin_user = User(
                    userName='admin',
                    userFirstName='Admin',
                    userLastName='User',
                    DateOfBirth='1990-01-01',
                    email='admin@gamearena.com',
                    password_hash=generate_password_hash('admin123'),
                )
                db.session.add(admin_user)
                db.session.commit()
                print("Admin user created: username=admin, password=admin123")
            
            # Seed games if not exist
            if Game.query.count() == 0:
                games_data = [
                    {"name": "RED DEAD II REDEMPTION", "price": 130, "category": "Category 1", "image": "../images/redead.jpg"},
                    {"name": "FIFA 23 (Ultimate Edition)", "price": 249, "category": "Category 2", "image": "../images/fifa1.jpg"},
                    {"name": "GRAND THEFT AUTO 6", "price": 220, "category": "Category 1", "image": "../images/gta1.jpg"},
                    {"name": "Forza Motorsport", "price": 279, "category": "Category 3", "image": "../images/forza.jpg"},
                    {"name": "Minecraft Legends", "price": 149, "category": "Category 2", "image": "../images/minicraft.jpg"},
                    {"name": "Call of Duty:Modern Warfare 2", "price": 349, "category": "Category 1", "image": "../images/call1.jpg"},
                    {"name": "Need for Speed™ Unbound", "price": 259, "category": "Category 3", "image": "../images/nfs.jpg"},
                    {"name": "The Sims 4 - Bundle Pack 5", "price": 299, "category": "Category 2", "image": "../images/sims.jpg"},
                    {"name": "Asphalt 9: Legends", "price": 159, "category": "Category 3", "image": "../images/asphalt.jpg"},
                    {"name": "WWE 2K23", "price": 229, "category": "Category 1", "image": "../images/wwe.jpg"},
                    {"name": "Spider-Man - Remastered", "price": 229, "category": "Category 2", "image": "../images/spider.jpg"},
                    {"name": "Assetto Corsa", "price": 99, "category": "Category 3", "image": "../images/assetto.jpg"},
                ]
                for g in games_data:
                    game = Game(name=g['name'], price=g['price'], category=g['category'], image=g['image'])
                    db.session.add(game)
                db.session.commit()
                print("Games seeded successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")
            return False
    return True


# Helper to check admin privileges
def is_admin_user(user):
    """Return True if the given User object should be considered an admin.

    This accepts the original convention (id == 1) for backwards compatibility
    and also treats any user with userName 'admin' as an admin.
    """
    if not user:
        return False
    return user.id == 1 or (hasattr(user, 'userName') and (user.userName == 'admin'))

# Initialize database tables
init_db()

@app.route('/')
def index():
    return send_from_directory(ROOT, 'index.html')

@app.route('/<path:filepath>')
def serve_file(filepath):
    # Don't catch API routes - let them be handled by their specific handlers
    if filepath.startswith('api/'):
        abort(404)
    
    # Basic safety: disallow access to python files, hidden files or parent traversal
    if filepath.endswith('.py') or filepath.startswith('.') or '..' in filepath:
        abort(404)

    full_path = os.path.join(ROOT, filepath)

    # If the requested path is a directory, try to serve its index.html
    if os.path.isdir(full_path):
        index_path = os.path.join(full_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(full_path, 'index.html')
        abort(404)

    if os.path.exists(full_path):
        directory = os.path.dirname(full_path)
        filename = os.path.basename(full_path)
        return send_from_directory(directory or ROOT, filename)

    abort(404)

@app.route('/api/login', methods=['POST'])
def api_login():
    print("DEBUG: /api/login called")
    data = request.get_json()
    if not data or 'userName' not in data or 'pw' not in data:
        return jsonify({'success': False, 'error': 'Invalid data'}), 400

    # Allow login with either username or email
    user = User.query.filter((User.userName == data['userName']) | (User.email == data['userName'])).first()
    if not user or not check_password_hash(user.password_hash, data['pw']):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    session['user_id'] = user.id
    print(f"DEBUG: User logged in: {user.userName}, id: {user.id}, session['user_id']: {session['user_id']}")
    return jsonify({'success': True, 'user': user.to_dict()}), 200

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('user_id', None)
    return jsonify({'success': True}), 200

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON'}), 400

    required = ['userName', 'userFirstName', 'userLastName', 'DateOfBirth', 'email', 'pw']
    for field in required:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing {field}'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'error': 'Email already in use'}), 400

    # Create user
    pw_hash = generate_password_hash(data['pw'])

    try:
        user = User(
            userName=data.get('userName'),
            userFirstName=data.get('userFirstName'),
            userLastName=data.get('userLastName'),
            DateOfBirth=data.get('DateOfBirth'),
            email=data.get('email'),
            password_hash=pw_hash,
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({'success': True, 'user': user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
def api_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/users/<int:user_id>', methods=['GET'])
def api_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@app.route('/api/games', methods=['GET'])
def api_games():
    games = Game.query.all()
    return jsonify([g.to_dict() for g in games])

@app.route('/api/games', methods=['POST'])
def api_add_game():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = request.get_json()
    if not data or 'name' not in data or 'price' not in data or 'category' not in data or 'image' not in data:
        return jsonify({'success': False, 'error': 'Invalid data'}), 400

    try:
        game = Game(
            name=data['name'],
            price=data['price'],
            category=data['category'],
            image=data['image']
        )
        db.session.add(game)
        db.session.commit()
        return jsonify({'success': True, 'game': game.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/comments/<int:game_id>', methods=['GET'])
def api_get_comments(game_id):
    comments = Comment.query.filter_by(game_id=game_id).order_by(Comment.timestamp).all()
    return jsonify([c.to_dict() for c in comments])

@app.route('/api/comments/<int:game_id>', methods=['POST'])
def api_post_comment(game_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'success': False, 'error': 'Invalid data'}), 400

    try:
        comment = Comment(
            user_id=session['user_id'],
            game_id=game_id,
            text=data['text']
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify({'success': True, 'comment': comment.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages', methods=['GET'])
def api_get_messages():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    user_id = session['user_id']
    messages = Message.query.filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).order_by(Message.timestamp).all()
    return jsonify([m.to_dict() for m in messages])

@app.route('/api/messages', methods=['POST'])
def api_send_message():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = request.get_json()
    if not data or 'receiver_id' not in data or 'text' not in data:
        return jsonify({'success': False, 'error': 'Invalid data'}), 400

    try:
        message = Message(
            sender_id=session['user_id'],
            receiver_id=data['receiver_id'],
            text=data['text']
        )
        db.session.add(message)
        db.session.commit()
        return jsonify({'success': True, 'message': message.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/share_game', methods=['POST'])
def api_share_game():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = request.get_json()
    if not data or 'game_id' not in data or 'shared_with_user_id' not in data:
        return jsonify({'success': False, 'error': 'Invalid data'}), 400

    try:
        shared_game = SharedGame(
            user_id=session['user_id'],
            game_id=data['game_id'],
            shared_with_user_id=data['shared_with_user_id']
        )
        db.session.add(shared_game)
        db.session.commit()
        return jsonify({'success': True, 'shared_game': shared_game.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile_image', methods=['POST'])
def api_upload_profile_image():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = request.get_json()
    if not data or 'fileData' not in data:
        return jsonify({'success': False, 'error': 'Invalid data'}), 400

    try:
        user = User.query.get(session['user_id'])
        user.fileData = data['fileData']
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/shared_games', methods=['GET'])
def api_get_shared_games():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    user_id = session['user_id']
    shared_games = SharedGame.query.filter_by(user_id=user_id).order_by(SharedGame.timestamp.desc()).all()
    return jsonify([sg.to_dict() for sg in shared_games])

@app.route('/api/purchase_game', methods=['POST'])
def api_purchase_game():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = request.get_json()
    if not data or 'game_id' not in data:
        return jsonify({'success': False, 'error': 'Invalid data'}), 400

    try:
        purchase = Purchase(
            user_id=session['user_id'],
            game_id=data['game_id']
        )
        db.session.add(purchase)
        db.session.commit()
        return jsonify({'success': True, 'purchase': purchase.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/login_status', methods=['GET'])
def api_login_status():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        return jsonify({'logged_in': True, 'user': user.to_dict()})
    else:
        return jsonify({'logged_in': False})

@app.route('/api/user_purchases', methods=['GET'])
def api_get_user_purchases():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    purchases = Purchase.query.filter_by(user_id=user_id).order_by(Purchase.purchase_date.desc()).all()
    return jsonify([p.to_dict() for p in purchases])

@app.route('/api/install_game/<int:purchase_id>', methods=['POST'])
def api_install_game(purchase_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    purchase = Purchase.query.get(purchase_id)
    if not purchase or purchase.user_id != session['user_id']:
        return jsonify({'success': False, 'error': 'Purchase not found'}), 404

    try:
        purchase.installed = True
        db.session.commit()
        return jsonify({'success': True, 'purchase': purchase.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/uninstall_game/<int:purchase_id>', methods=['POST'])
def api_uninstall_game(purchase_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    purchase = Purchase.query.get(purchase_id)
    if not purchase or purchase.user_id != session['user_id']:
        return jsonify({'success': False, 'error': 'Purchase not found'}), 404

    try:
        purchase.installed = False
        db.session.commit()
        return jsonify({'success': True, 'purchase': purchase.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============ ADMIN API ENDPOINTS ============

@app.route('/api/admin/users', methods=['GET'])
def api_admin_users():
    with open('d:/SteamClone-main/debug.log', 'a') as f:
        f.write(f"api_admin_users called\n")
        f.write(f"session: {dict(session)}\n")
        f.write(f"'user_id' in session: {'user_id' in session}\n")
    
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    with open('d:/SteamClone-main/debug.log', 'a') as f:
        f.write(f"user_id: {user_id}, user: {user}\n")
        if user:
            f.write(f"user.userName: {user.userName}\n")
            f.write(f"is_admin_user(user): {is_admin_user(user)}\n")
    
    if not is_admin_user(user):
        return jsonify({'error': 'Not authorized'}), 403
    
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def api_admin_delete_user(user_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    admin = User.query.get(session['user_id'])
    if not is_admin_user(admin):
        return jsonify({'error': 'Not authorized'}), 403

    # Prevent deleting the seeded admin account (by id or by username)
    user_to_delete = User.query.get(user_id)
    if user_to_delete and user_to_delete.userName == 'admin':
        return jsonify({'error': 'Cannot delete admin user'}), 400
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete related records
        Purchase.query.filter_by(user_id=user_id).delete()
        Message.query.filter(db.or_(Message.sender_id == user_id, Message.receiver_id == user_id)).delete()
        Comment.query.filter_by(user_id=user_id).delete()
        SharedGame.query.filter_by(user_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/games', methods=['GET'])
def api_admin_games():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = User.query.get(session['user_id'])
    if not is_admin_user(user):
        return jsonify({'error': 'Not authorized'}), 403
    
    games = Game.query.all()
    return jsonify([g.to_dict() for g in games])

@app.route('/api/admin/games', methods=['POST'])
def api_admin_add_game():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    admin = User.query.get(session['user_id'])
    if not is_admin_user(admin):
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'price', 'category', 'image']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        game = Game(
            name=data['name'],
            price=data['price'],
            category=data['category'],
            image=data['image']
        )
        db.session.add(game)
        db.session.commit()
        return jsonify({'success': True, 'game': game.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/games/<int:game_id>', methods=['PUT'])
def api_admin_update_game(game_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    admin = User.query.get(session['user_id'])
    if not is_admin_user(admin):
        return jsonify({'error': 'Not authorized'}), 403
    
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    try:
        if 'name' in data:
            game.name = data['name']
        if 'price' in data:
            game.price = data['price']
        if 'category' in data:
            game.category = data['category']
        if 'image' in data:
            game.image = data['image']
        
        db.session.commit()
        return jsonify({'success': True, 'game': game.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/games/<int:game_id>', methods=['DELETE'])
def api_admin_delete_game(game_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    admin = User.query.get(session['user_id'])
    if not is_admin_user(admin):
        return jsonify({'error': 'Not authorized'}), 403
    
    try:
        game = Game.query.get(game_id)
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        # Delete related records
        Purchase.query.filter_by(game_id=game_id).delete()
        Comment.query.filter_by(game_id=game_id).delete()
        SharedGame.query.filter_by(game_id=game_id).delete()
        
        db.session.delete(game)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/stats', methods=['GET'])
def api_admin_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = User.query.get(session['user_id'])
    if not is_admin_user(user):
        return jsonify({'error': 'Not authorized'}), 403
    
    try:
        # Calculate total revenue from purchases
        total_revenue = 0
        purchases = Purchase.query.all()
        for purchase in purchases:
            total_revenue += purchase.game.price
        
        stats = {
            'total_users': User.query.count(),
            'total_games': Game.query.count(),
            'total_purchases': Purchase.query.count(),
            'total_revenue': float(total_revenue),
            'total_messages': Message.query.count(),
            'total_comments': Comment.query.count(),
        }
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error calculating stats: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/recent_purchases', methods=['GET'])
def api_admin_recent_purchases():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    admin = User.query.get(session['user_id'])
    if not is_admin_user(admin):
        return jsonify({'error': 'Not authorized'}), 403

    try:
        purchases = Purchase.query.order_by(Purchase.purchase_date.desc()).limit(10).all()
        return jsonify([p.to_dict() for p in purchases]), 200
    except Exception as e:
        print(f"Error fetching recent purchases: {e}")
        return jsonify({'error': str(e)}), 500

def main():
    try:
        # Only run on localhost for faster debugging
        app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=True)
    except Exception as e:
        print(f"Error starting Flask app: {e}")
        return 1
    return 0

if __name__ == '__main__':
    exit_code = main()
    if exit_code != 0:
        sys.exit(exit_code)
