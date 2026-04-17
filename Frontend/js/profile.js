/* =========================================================
   profile.js — User profile page
   Does NOT depend on feed.js — has its own post renderer
   ========================================================= */

function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildProfilePostCard(post, currentUserId) {
  // Guard against null author (e.g. user was deleted)
  const authorName = post.author?.username || 'Deleted User';
  const authorId = post.author?._id || '';
  const isLiked = Array.isArray(post.likes) && post.likes.includes(currentUserId);
  const time = relativeTime(post.createdAt);
  const isOwner = currentUserId && authorId && authorId === currentUserId;

  // Filter out comments where the user reference is null
  const commentsHtml = post.comments.filter(c => c && c.user).map(c => `
    <div class="comment-item">
      ${avatarHTML(c.user.username, 'avatar-sm')}
      <div class="comment-bubble">
        <div class="comment-username">${c.user.username}</div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
    </div>
  `).join('');

  const optionsMenu = isOwner ? `
    <div class="post-options" id="options-wrap-${post._id}">
      <button class="post-options-btn" onclick="profileToggleOptionsMenu('${post._id}')" title="Options">⋯</button>
      <div class="post-options-dropdown" id="options-menu-${post._id}">
        <button class="dropdown-item danger" onclick="profileDeletePost('${post._id}')">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete Post
        </button>
      </div>
    </div>
  ` : '';

  return `
    <div class="post-card" id="post-card-${post._id}">
      <div class="post-body">
        <div class="post-meta">
          ${avatarHTML(authorName)}
          <div class="post-meta-info">
            <span class="post-author-name">${authorName}</span>
            <span class="post-timestamp">${time}</span>
          </div>
          ${optionsMenu}
        </div>
        <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
        <div class="post-actions-bar">
          <button class="action-btn ${isLiked ? 'liked' : ''}" id="like-btn-${post._id}" onclick="profileToggleLike('${post._id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span id="likes-count-${post._id}">${post.likes.length}</span>
          </button>
          <button class="action-btn" onclick="profileToggleComments('${post._id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span id="comment-count-${post._id}">${post.comments.length}</span>
          </button>
        </div>
      </div>
      <div class="comments-wrapper" id="comments-${post._id}">
        <div id="comments-list-${post._id}">${commentsHtml}</div>
        <div class="comment-input-row">
          ${avatarHTML(currentUserId ? getUser()?.username : '', 'avatar-sm')}
          <input type="text" id="comment-input-${post._id}" placeholder="Write a comment…">
          <button class="comment-submit-btn" onclick="profileAddComment(event, '${post._id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const profileContainer = document.getElementById('profile-posts-container');
  if (!profileContainer) return;

  const params = new URLSearchParams(window.location.search);
  const currentUser = getUser();
  const targetUserId = params.get('id') || currentUser?.id;

  if (!targetUserId) { window.location.href = 'index.html'; return; }

  const isOwnProfile = currentUser && currentUser.id === targetUserId;

  /* ---- Load profile info ---- */
  try {
    const res = await fetch(`${API_URL}/users/${targetUserId}`);
    if (!res.ok) throw new Error('User not found');
    const user = await res.json();

    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent = user.email || '';

    const avatarContainer = document.getElementById('profile-avatar-container');
    avatarContainer.innerHTML = avatarHTML(user.username, 'avatar-lg');

    document.getElementById('followers-count').textContent = user.followers.length;
    document.getElementById('following-count').textContent = user.following.length;

    document.title = `${user.username} — SocialApp`;

    document.getElementById('posts-section-title').innerHTML = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      ${isOwnProfile ? 'Your Posts' : `${user.username}'s Posts`}
    `;

    if (!isOwnProfile && currentUser) {
      const isFollowing = user.followers.includes(currentUser.id);
      document.getElementById('follow-action-container').innerHTML = `
        <button class="btn ${isFollowing ? 'btn-danger-outline' : 'btn-primary'}" id="follow-btn">
          ${isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      `;
      document.getElementById('follow-btn').addEventListener('click', () => handleFollow(targetUserId));
    }
  } catch (err) {
    // Fall back to localStorage data so the profile doesn't get stuck
    const fallback = isOwnProfile ? currentUser : null;
    if (fallback) {
      document.getElementById('profile-username').textContent = fallback.username || 'Unknown';
      const avatarContainer = document.getElementById('profile-avatar-container');
      avatarContainer.innerHTML = avatarHTML(fallback.username || '?', 'avatar-lg');
      document.title = `${fallback.username} — SocialApp`;
      document.getElementById('posts-section-title').innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Your Posts
      `;
      document.getElementById('followers-count').textContent = '0';
      document.getElementById('following-count').textContent = '0';
    } else {
      showAlert('Could not load profile: ' + err.message, 'error');
    }
  }

  /* ---- Load this user's posts only ---- */
  try {
    const res = await fetch(`${API_URL}/posts/user/${targetUserId}`);
    if (!res.ok) throw new Error('Could not load posts');
    const posts = await res.json();

    document.getElementById('posts-count').textContent = posts.length;

    if (!posts.length) {
      profileContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✍️</div>
          <h3>${isOwnProfile ? "You haven't posted yet" : "No posts yet"}</h3>
          <p>${isOwnProfile ? 'Go to the feed and share something!' : 'This user has nothing to show yet.'}</p>
        </div>`;
      return;
    }

    profileContainer.innerHTML = posts.map(p => buildProfilePostCard(p, currentUser?.id)).join('');
  } catch (err) {
    profileContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Could not load posts</h3><p>${err.message}</p></div>`;
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.post-options')) {
      document.querySelectorAll('.post-options-dropdown.open').forEach(el => el.classList.remove('open'));
    }
  });
});

/* ===== FOLLOW/UNFOLLOW ===== */
async function handleFollow(userId) {
  try {
    const res = await fetch(`${API_URL}/users/follow/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Action failed');
    const data = await res.json();

    const btn = document.getElementById('follow-btn');
    if (btn) {
      btn.textContent = data.isFollowing ? 'Unfollow' : 'Follow';
      btn.className = `btn ${data.isFollowing ? 'btn-danger-outline' : 'btn-primary'}`;
    }

    const uRes = await fetch(`${API_URL}/users/${userId}`);
    if (uRes.ok) {
      const u = await uRes.json();
      document.getElementById('followers-count').textContent = u.followers.length;
    }

    setUser({ ...getUser(), following: data.following });
    showAlert(data.isFollowing ? 'You are now following this user' : 'Unfollowed', 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

/* ===== OPTIONS MENU ===== */
function profileToggleOptionsMenu(postId) {
  document.querySelectorAll('.post-options-dropdown.open').forEach(el => {
    if (el.id !== `options-menu-${postId}`) el.classList.remove('open');
  });
  document.getElementById(`options-menu-${postId}`)?.classList.toggle('open');
}

/* ===== DELETE POST ===== */
async function profileDeletePost(postId) {
  document.getElementById(`options-menu-${postId}`)?.classList.remove('open');

  if (!confirm('Delete this post? This cannot be undone.')) return;

  try {
    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete post');

    const card = document.getElementById(`post-card-${postId}`);
    if (card) {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.97)';
      setTimeout(() => {
        card.remove();
        // Update posts count
        const countEl = document.getElementById('posts-count');
        if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
      }, 300);
    }

    showAlert('Post deleted', 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

/* ===== POST INTERACTIONS ===== */
async function profileToggleLike(postId) {
  const btn = document.getElementById(`like-btn-${postId}`);
  if (!btn) return;
  try {
    const res = await fetch(`${API_URL}/posts/like/${postId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error();
    const likes = await res.json();
    const isLiked = likes.includes(getUser()?.id);
    btn.className = `action-btn ${isLiked ? 'liked' : ''}`;
    btn.querySelector('svg')?.setAttribute('fill', isLiked ? 'currentColor' : 'none');
    const countEl = document.getElementById(`likes-count-${postId}`);
    if (countEl) countEl.textContent = likes.length;
  } catch {
    showAlert('Action failed', 'error');
  }
}

function profileToggleComments(postId) {
  document.getElementById(`comments-${postId}`)?.classList.toggle('visible');
}

async function profileAddComment(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input?.value.trim();
  if (!text) return;
  try {
    const res = await fetch(`${API_URL}/posts/comment/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error();
    const comments = await res.json();
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (listEl) {
      listEl.innerHTML = comments.map(c => `
        <div class="comment-item">
          ${avatarHTML(c.user.username, 'avatar-sm')}
          <div class="comment-bubble">
            <div class="comment-username">${c.user.username}</div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
          </div>
        </div>
      `).join('');
    }
    input.value = '';
    const countEl = document.getElementById(`comment-count-${postId}`);
    if (countEl) countEl.textContent = comments.length;
  } catch {
    showAlert('Failed to post comment', 'error');
  }
}
