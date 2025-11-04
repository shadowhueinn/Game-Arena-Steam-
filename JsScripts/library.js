document.addEventListener('DOMContentLoaded', function() {
    loadUserPurchases();
    setupFilters();
    setupModal();
});

function loadUserPurchases() {
    fetch('/api/user_purchases', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error loading purchases: ' + data.error);
            return;
        }
        displayGames(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error loading purchases');
    });
}

function displayGames(purchases) {
    const gamesGrid = document.getElementById('games-grid');
    gamesGrid.innerHTML = '';

    if (purchases.length === 0) {
        gamesGrid.innerHTML = '<p style="color: #b8b6b4; text-align: center; grid-column: 1 / -1;">No games in your library yet.</p>';
        return;
    }

    purchases.forEach(purchase => {
        const gameCard = createGameCard(purchase);
        gamesGrid.appendChild(gameCard);
    });
}

function createGameCard(purchase) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.dataset.purchaseId = purchase.id;
    gameCard.dataset.installed = purchase.installed;

    const statusBadge = purchase.installed ? 'installed-badge' : 'not-installed-badge';
    const statusText = purchase.installed ? 'Installed' : 'Not Installed';

    gameCard.innerHTML = `
        <img src="${purchase.game_image}" alt="${purchase.game_name}" class="game-image" onerror="this.src='../images/default-game.jpg'">
        <div class="install-status ${statusBadge}">${statusText}</div>
        <div class="game-info">
            <span class="game-title">${purchase.game_name}</span>
            <div class="game-price">$${purchase.game_price}</div>
            <div class="purchase-date">Purchased: ${new Date(purchase.purchase_date).toLocaleDateString()}</div>
            <div class="game-actions">
                ${purchase.installed ?
                    `<button class="play-btn" onclick="playGame(${purchase.id})">Play</button>
                     <button class="uninstall-btn" onclick="uninstallGame(${purchase.id})">Uninstall</button>` :
                    `<button class="install-btn" onclick="installGame(${purchase.id})">Install</button>`
                }
            </div>
        </div>
    `;

    return gameCard;
}

function installGame(purchaseId) {
    showInstallModal('Installing Game');

    // Simulate installation progress
    let progress = 0;
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    const progressSteps = [
        'Preparing installation...',
        'Downloading game files...',
        'Extracting files...',
        'Installing dependencies...',
        'Finalizing installation...',
        'Installation complete!'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        progressFill.style.width = progress + '%';

        if (progress >= (stepIndex + 1) * (100 / progressSteps.length)) {
            progressText.textContent = progressSteps[stepIndex];
            stepIndex++;
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                // Send API request to mark as installed
                fetch(`/api/install_game/${purchaseId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        hideInstallModal();
                        loadUserPurchases(); // Refresh the library
                    } else {
                        alert('Error installing game: ' + data.error);
                        hideInstallModal();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error installing game');
                    hideInstallModal();
                });
            }, 500);
        }
    }, 200);
}

function uninstallGame(purchaseId) {
    if (!confirm('Are you sure you want to uninstall this game?')) {
        return;
    }

    fetch(`/api/uninstall_game/${purchaseId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadUserPurchases(); // Refresh the library
        } else {
            alert('Error uninstalling game: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error uninstalling game');
    });
}

function playGame(purchaseId) {
    // In a real implementation, this would launch the game
    alert('Launching game... (This would open the game executable in a real implementation)');
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            const filter = this.dataset.filter;
            filterGames(filter);
        });
    });
}

function filterGames(filter) {
    const gameCards = document.querySelectorAll('.game-card');

    gameCards.forEach(card => {
        const isInstalled = card.dataset.installed === 'true';

        switch (filter) {
            case 'all':
                card.style.display = 'block';
                break;
            case 'installed':
                card.style.display = isInstalled ? 'block' : 'none';
                break;
            case 'not-installed':
                card.style.display = !isInstalled ? 'block' : 'none';
                break;
        }
    });
}

function setupModal() {
    const modal = document.getElementById('install-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.onclick = function() {
        hideInstallModal();
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            hideInstallModal();
        }
    }
}

function showInstallModal(title) {
    const modal = document.getElementById('install-modal');
    const modalTitle = document.getElementById('modal-title');
    const progressFill = document.getElementById('progress-fill');

    modalTitle.textContent = title;
    progressFill.style.width = '0%';
    modal.style.display = 'block';
}

function hideInstallModal() {
    const modal = document.getElementById('install-modal');
    modal.style.display = 'none';
}
