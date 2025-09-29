/* ...existing code... */
import dayjs from 'dayjs';

const $ = (id) => document.getElementById(id);
const formatNum = (n) => (n ?? 0).toLocaleString();

async function resolveUser() {
  const params = new URLSearchParams(location.search);
  const q = params.get('user');
  if (q) return q;
  try {
    const me = await window.websim.getCurrentUser();
    return me?.username;
  } catch { return null; }
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadProfile() {
  const username = await resolveUser();
  if (!username) throw new Error('No user specified');
  const base = 'https://api.websim.com/api/v1';
  const [user, stats, projects] = await Promise.all([
    fetchJSON(`${base}/users/${username}`),
    fetchJSON(`${base}/users/${username}/stats`).catch(() => ({})),
    fetchJSON(`${base}/users/${username}/projects?first=12`).catch(() => ({ projects: { data: [] } }))
  ]);

  const u = user?.user ?? user; // API can wrap in { user }
  $('username').textContent = u.username || username;
  $('avatar').src = u.avatar_url || '';
  $('avatar').alt = `${u.username} avatar`;
  $('joined').textContent = u.created_at ? `Joined ${dayjs(u.created_at).format('MMM D, YYYY')}` : '';

  $('viewOnWebsim').href = `https://websim.ai/@${u.username}`;

  // Aggregate fallback from projects if stats missing
  const list = (projects.projects?.data || []).map(p => p.project || p);
  const agg = list.reduce((acc, p) => {
    const s = p.stats || {};
    acc.views += s.views || 0;
    acc.likes += s.likes || 0;
    acc.comments += s.comments || 0;
    return acc;
  }, { views: 0, likes: 0, comments: 0 });

  $('projectsCount').textContent = formatNum(stats.projects ?? list.length);
  $('viewsCount').textContent = formatNum(stats.views ?? agg.views);
  $('likesCount').textContent = formatNum(stats.likes ?? agg.likes);
  $('commentsCount').textContent = formatNum(stats.comments ?? agg.comments);
  $('followersCount').textContent = formatNum(stats.followers ?? u.followers_count ?? 0);
  $('followingCount').textContent = formatNum(stats.following ?? u.following_count ?? 0);

  // Render recent projects
  const wrap = $('projects');
  wrap.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = `https://websim.ai${p.link_url || `/@${u.username}/slugs/${p.slug}`}`;
    card.target = '_blank';
    card.rel = 'noopener';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <div class="project-title">${p.title || 'Untitled'}</div>
      <div class="project-meta">
        <span>👍 ${formatNum(p.stats?.likes || 0)}</span>
        <span>👁️ ${formatNum(p.stats?.views || 0)}</span>
        <span>💬 ${formatNum(p.stats?.comments || 0)}</span>
      </div>
    `;
    wrap.appendChild(card);
  });
}

function setupDocs() {
  const dlg = document.querySelector('#docsDialog');
  const btn = document.querySelector('#toggleDocs');
  btn.addEventListener('click', () => {
    const { apiDocumentationPreamble, apiDocumentationContent } = window.websimApiDocs || {};
    document.querySelector('#docsContent').textContent = apiDocumentationContent || apiDocumentationPreamble || 'No docs';
    dlg.showModal();
  });
  dlg.querySelector('.close').addEventListener('click', () => dlg.close());
}

(async function init() {
  try {
    setupDocs();
    await loadProfile();
  } catch (e) {
    console.error(e);
    $('username').textContent = 'Error loading profile';
    $('joined').textContent = '';
  }
})();

