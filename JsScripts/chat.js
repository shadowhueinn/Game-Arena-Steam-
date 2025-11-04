// Chat functionality for chat.html

let selectedUserId = null;

function loadUsers() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedUserIdFromUrl = urlParams.get('user');
    fetch('/api/users')
        .then(response => response.json())
        .then(users => {
            const usersList = document.getElementById('users-list');
            usersList.innerHTML = '';
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'list-group-item list-group-item-action';
                userDiv.textContent = user.userName;
                userDiv.onclick = () => selectUser(user.id);
                if (selectedUserIdFromUrl && user.id == selectedUserIdFromUrl) {
                    selectUser(user.id);
                }
                usersList.appendChild(userDiv);
            });
        })
        .catch(error => console.error('Error loading users:', error));
}

function selectUser(userId) {
    selectedUserId = userId;
    loadMessages();
}

function loadMessages() {
    if (!selectedUserId) return;

    fetch('/api/messages')
        .then(response => response.json())
        .then(messages => {
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '';
            messages.forEach(message => {
                if (message.sender_id === selectedUserId || message.receiver_id === selectedUserId) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message';
                    messageDiv.innerHTML = `
                        <strong>${message.sender_name}:</strong> ${message.text}
                        <small>${new Date(message.timestamp).toLocaleString()}</small>
                    `;
                    chatMessages.appendChild(messageDiv);
                }
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch(error => console.error('Error loading messages:', error));
}

function sendMessage() {
    if (!selectedUserId) {
        alert('Please select a user to chat with.');
        return;
    }

    const text = document.getElementById('message-text').value.trim();
    if (!text) return;

    fetch('/api/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            receiver_id: selectedUserId,
            text
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('message-text').value = '';
            loadMessages();
        } else {
            alert('Error sending message: ' + data.error);
        }
    })
    .catch(error => console.error('Error sending message:', error));
}

// Load users on page load and poll for new messages
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setInterval(loadMessages, 5000); // Poll every 5 seconds
});
