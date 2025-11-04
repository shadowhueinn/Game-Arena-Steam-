// Authentication utilities
class Auth {
    constructor() {
        this.checkLoginStatus();
    }

    // Check if user is logged in
    async checkLoginStatus() {
        try {
            const response = await fetch('/api/login_status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'  // Include cookies for session
            });

            if (response.ok) {
                const data = await response.json();
                if (data.logged_in) {
                    this.isLoggedIn = true;
                    this.user = data.user;
                    // Fetch purchases separately
                    await this.fetchPurchases();
                    this.dispatchLoginEvent();
                } else {
                    this.isLoggedIn = false;
                    this.userPurchases = [];
                }
            } else {
                this.isLoggedIn = false;
                this.userPurchases = [];
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            this.isLoggedIn = false;
            this.userPurchases = [];
        }
    }

    // Fetch user purchases
    async fetchPurchases() {
        try {
            const response = await fetch('/api/user_purchases', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                this.userPurchases = await response.json();
            } else {
                this.userPurchases = [];
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
            this.userPurchases = [];
        }
    }

    // Login user
    async login(userName, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',  // Include cookies for session
                body: JSON.stringify({
                    userName: userName,
                    pw: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.isLoggedIn = true;
                await this.checkLoginStatus(); // Refresh purchases
                this.dispatchLoginEvent();
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Logout user
    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'  // Include cookies for session
            });

            if (response.ok) {
                this.isLoggedIn = false;
                this.userPurchases = [];
                this.dispatchLogoutEvent();
                return { success: true };
            } else {
                return { success: false, error: 'Logout failed' };
            }
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Purchase game
    async purchaseGame(gameId) {
        if (!this.isLoggedIn) {
            return { success: false, error: 'Not logged in' };
        }

        try {
            const response = await fetch('/api/purchase_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',  // Include cookies for session
                body: JSON.stringify({
                    game_id: gameId
                })
            });

            const data = await response.json();

            if (data.success) {
                await this.checkLoginStatus(); // Refresh purchases
                return { success: true, purchase: data.purchase };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Purchase error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Check if user owns a game
    ownsGame(gameId) {
        return this.userPurchases.some(purchase => purchase.game_id === gameId);
    }

    // Dispatch login event
    dispatchLoginEvent() {
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
    }

    // Dispatch logout event
    dispatchLogoutEvent() {
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
}

// Create global auth instance
const auth = new Auth();

// Make auth available globally
window.auth = auth;
