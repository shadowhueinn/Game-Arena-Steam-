// Comment functionality for gamePage.html

let currentGameId = 1; // Assuming game ID from URL or context, adjust as needed

function loadComments() {
    fetch(`/api/comments/${currentGameId}`)
        .then(response => response.json())
        .then(comments => {
            const commentsList = document.getElementById('comments-list');
            commentsList.innerHTML = '';
            comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                commentDiv.innerHTML = `
                    <strong>${comment.user_name}</strong>: ${comment.text}
                    <small>${new Date(comment.timestamp).toLocaleString()}</small>
                `;
                commentsList.appendChild(commentDiv);
            });
        })
        .catch(error => console.error('Error loading comments:', error));
}

function postComment() {
    const text = document.getElementById('comment-text').value.trim();
    if (!text) return;

    fetch(`/api/comments/${currentGameId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('comment-text').value = '';
            loadComments();
        } else {
            alert('Error posting comment: ' + data.error);
        }
    })
    .catch(error => console.error('Error posting comment:', error));
}

function shareGame() {
    const sharedWithUserId = prompt('Enter the user ID to share with:');
    if (!sharedWithUserId) return;

    fetch('/api/share_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            game_id: currentGameId,
            shared_with_user_id: parseInt(sharedWithUserId)
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Game shared successfully!');
        } else {
            alert('Error sharing game: ' + data.error);
        }
    })
    .catch(error => console.error('Error sharing game:', error));
}

// Load comments on page load
document.addEventListener('DOMContentLoaded', loadComments);
