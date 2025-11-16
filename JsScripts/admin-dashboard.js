// Admin Dashboard JavaScript

let currentTab = 'dashboard';

function switchTab(tab) {
    // Hide all tabs
    document.getElementById('dashboard-tab').style.display = 'none';
    document.getElementById('users-tab').style.display = 'none';
    document.getElementById('games-tab').style.display = 'none';
    
    // Remove active class from all buttons
    document.querySelectorAll('.list-group-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tab + '-tab').style.display = 'block';
    event.target.classList.add('active');
    
    currentTab = tab;
    
    // Load data based on tab
    if (tab === 'dashboard') {
        loadDashboardStats();
    } else if (tab === 'users') {
        loadUsers();
    } else if (tab === 'games') {
        loadGames();
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats', { credentials: 'same-origin' });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error('Not logged in or not authorized');
                // Clear stored admin and redirect to login
                localStorage.removeItem('adminUser');
                window.location.href = './admin-login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const stats = await response.json();

        document.getElementById('stat-users').textContent = stats.total_users;
        document.getElementById('stat-games').textContent = stats.total_games;
        document.getElementById('stat-purchases').textContent = stats.total_purchases;
        document.getElementById('stat-revenue').textContent = '$' + (stats.total_revenue || 0).toFixed(2);

        // Also load recent users and purchases
        await loadRecentUsers();
        await loadRecentPurchases();
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('stat-users').textContent = 'Error';
        document.getElementById('stat-games').textContent = 'Error';
        document.getElementById('stat-purchases').textContent = 'Error';
        document.getElementById('stat-revenue').textContent = 'Error';

        // populate recent lists with error state
        const ru = document.getElementById('recent-users-list');
        if (ru) ru.innerHTML = '<li class="list-group-item text-danger">Failed to load recent users</li>';
        const rp = document.getElementById('recent-purchases-list');
        if (rp) rp.innerHTML = '<li class="list-group-item text-danger">Failed to load recent purchases</li>';
    }
}

// Load recent users (top 5 newest)
async function loadRecentUsers() {
    try {
        const response = await fetch('/api/admin/users', { credentials: 'same-origin' });
        if (!response.ok) {
            console.error('Failed to load users for recent list');
            document.getElementById('recent-users-list').innerHTML = '<li class="list-group-item text-muted">No data</li>';
            return;
        }
        const users = await response.json();
        const list = document.getElementById('recent-users-list');
        list.innerHTML = '';
        // sort by id desc to get newest and show up to 5
        users.sort((a,b) => b.id - a.id).slice(0,5).forEach(u => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${u.userName} — ${u.email}`;
            list.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading recent users:', err);
        document.getElementById('recent-users-list').innerHTML = '<li class="list-group-item text-danger">Failed to load recent users</li>';
    }
}

// Load recent purchases (last 5)
async function loadRecentPurchases() {
    try {
        const response = await fetch('/api/admin/recent_purchases', { credentials: 'same-origin' });
        if (!response.ok) {
            console.error('Failed to load recent purchases');
            document.getElementById('recent-purchases-list').innerHTML = '<li class="list-group-item text-muted">No data</li>';
            return;
        }
        const purchases = await response.json();
        const list = document.getElementById('recent-purchases-list');
        list.innerHTML = '';
        purchases.slice(0,5).forEach(p => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${p.user_name} purchased ${p.game_name} — $${p.game_price}`;
            list.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading recent purchases:', err);
        document.getElementById('recent-purchases-list').innerHTML = '<li class="list-group-item text-danger">Failed to load recent purchases</li>';
    }
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', { credentials: 'same-origin' });
        if (!response.ok) {
            if (response.status === 403) {
                console.error('Not authorized to view users');
            }
            return;
        }        const users = await response.json();
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.userName}</td>
                <td>${user.userFirstName}</td>
                <td>${user.userLastName}</td>
                <td>${user.email}</td>
                <td>${user.DateOfBirth || 'N/A'}</td>
                <td>
                    ${user.userName !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>` : '<span class="badge badge-primary">Admin</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users');
    }
}

// Delete User
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            alert('User deleted successfully');
            loadUsers();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}

// Load Games
async function loadGames() {
    try {
        const response = await fetch('/api/admin/games', { credentials: 'same-origin' });
        if (!response.ok) {
            if (response.status === 403) {
                console.error('Not authorized to view games');
            }
            return;
        }        const games = await response.json();
        const tbody = document.getElementById('games-table-body');
        tbody.innerHTML = '';
        
        if (games.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No games found</td></tr>';
            return;
        }
        
        games.forEach(game => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.id}</td>
                <td>${game.name}</td>
                <td>$${game.price.toFixed(2)}</td>
                <td>${game.category}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editGame(${game.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGame(${game.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading games:', error);
        alert('Failed to load games');
    }
}

// Show Add Game Form
function showAddGameForm() {
    document.getElementById('add-game-form').style.display = 'block';
}

// Hide Add Game Form
function hideAddGameForm() {
    document.getElementById('add-game-form').style.display = 'none';
    document.getElementById('game-name').value = '';
    document.getElementById('game-price').value = '';
    document.getElementById('game-category').value = '';
    document.getElementById('game-image').value = '';
}

// Add Game
async function addGame(event) {
    event.preventDefault();
    
    const gameData = {
        name: document.getElementById('game-name').value,
        price: parseFloat(document.getElementById('game-price').value),
        category: document.getElementById('game-category').value,
        image: document.getElementById('game-image').value
    };
    
    try {
        const response = await fetch('/api/admin/games', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        });
        
        if (response.ok) {
            alert('Game added successfully');
            hideAddGameForm();
            loadGames();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error adding game:', error);
        alert('Failed to add game');
    }
}

// Delete Game
async function deleteGame(gameId) {
    if (!confirm('Are you sure you want to delete this game?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/games/${gameId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            alert('Game deleted successfully');
            loadGames();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error deleting game:', error);
        alert('Failed to delete game');
    }
}

// Edit Game (placeholder for now)
function editGame(gameId) {
    alert('Edit feature coming soon for game ID: ' + gameId);
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear localStorage and logout
        localStorage.removeItem('adminUser');
        fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
            .then(() => {
                window.location.href = '../index.html';
            })
            .catch(error => console.error('Error logging out:', error));
    }
}

// On page load, check if admin is logged in via localStorage
document.addEventListener('DOMContentLoaded', () => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
        // Not logged in as admin, redirect to login
        window.location.href = './admin-login.html';
        return;
    }
    // Admin is logged in, page is ready. Load stats when Dashboard tab is clicked (not on initial load)
    // This prevents early 403 errors
});
