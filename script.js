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

async function fetchJSON(url, timeout = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  const res = await fetch(url, { signal: ctrl.signal });
  clearTimeout(t);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadProfile() {
  const username = await resolveUser();
  if (!username) throw new Error('No user specified');
  const base = 'https://api.websim.com/api/v1';
  let statsSet = false;

  const user = await fetchJSON(`${base}/users/${username}`).catch(() => null);
  const u = user?.user ?? user ?? { username };
  $('username').textContent = u.username || username;
  $('avatar').src = u.avatar_url || '';
  $('avatar').alt = `${u.username} avatar`;
  $('joined').textContent = u.created_at ? `Joined ${dayjs(u.created_at).format('MMM D, YYYY')}` : '';
  $('viewOnWebsim').href = `https://websim.ai/@${u.username}`;
  $('followersCount').textContent = formatNum(u.followers_count ?? 0);
  $('followingCount').textContent = formatNum(u.following_count ?? 0);

  fetchJSON(`${base}/users/${username}/stats`).then(stats => {
    $('projectsCount').textContent = formatNum(stats.projects);
    $('viewsCount').textContent = formatNum(stats.views);
    $('likesCount').textContent = formatNum(stats.likes);
    $('commentsCount').textContent = formatNum(stats.comments);
    $('followersCount').textContent = formatNum(stats.followers ?? u.followers_count ?? 0);
    $('followingCount').textContent = formatNum(stats.following ?? u.following_count ?? 0);
    statsSet = true;
  }).catch(() => { /* keep fallbacks */ });

  fetchJSON(`${base}/users/${username}/projects?first=12`).then(projects => {
    const list = (projects.projects?.data || []).map(p => p.project || p);
    const wrap = $('projects'); wrap.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('a');
      card.className = 'project-card';
      card.href = `https://websim.ai${p.link_url || `/@${u.username}/slugs/${p.slug}`}`;
      card.target = '_blank'; card.rel = 'noopener';
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
    if (!statsSet) {
      const agg = list.reduce((a, p) => {
        const s = p.stats || {}; a.views += s.views || 0; a.likes += s.likes || 0; a.comments += s.comments || 0; return a;
      }, { views: 0, likes: 0, comments: 0 });
      $('projectsCount').textContent = formatNum(list.length);
      $('viewsCount').textContent = formatNum(agg.views);
      $('likesCount').textContent = formatNum(agg.likes);
      $('commentsCount').textContent = formatNum(agg.comments);
    }
  }).catch(() => { /* no projects */ });
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