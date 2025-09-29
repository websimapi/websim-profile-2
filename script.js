/* ...existing code... */
import dayjs from 'dayjs';

const $ = (id) => document.getElementById(id);
const formatNum = (n) => (n ?? 0).toLocaleString();

async function resolveUser() {
  console.log('🔍 Starting user resolution...');
  
  const params = new URLSearchParams(location.search);
  const q = params.get('user');
  console.log('🔍 URL param "user":', q);
  
  if (q) {
    console.log('✅ Using user from URL parameter:', q);
    return q;
  }
  
  try {
    console.log('🔍 No URL param, trying getCurrentUser()...');
    const me = await window.websim.getCurrentUser();
    console.log('🔍 getCurrentUser() result:', me);
    const username = me?.username;
    console.log('✅ Resolved current user:', username);
    return username;
  } catch (getCurrentUserError) { 
    console.error('❌ getCurrentUser() failed:', getCurrentUserError);
    return null; 
  }
}

async function fetchJSON(url, timeout = 10000) {
  const ctrl = new AbortController(), start = performance.now(); 
  console.log('[API] 🌐 Starting GET request:', url, { timeout });
  const t = setTimeout(() => { 
    console.warn('[API] ⏰ Request timeout after', timeout, 'ms for:', url); 
    ctrl.abort(); 
  }, timeout);
  try {
    console.log('[API] 📡 Sending fetch request to:', url);
    const res = await fetch(url, { signal: ctrl.signal }); 
    clearTimeout(t);
    const elapsed = Math.round(performance.now()-start);
    console.log('[API] 📥 Response received:', url, {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      elapsed: `${elapsed}ms`,
      headers: Object.fromEntries(res.headers.entries())
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error body');
      console.error('[API] ❌ HTTP Error:', res.status, res.statusText, 'Body:', errorText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json(); 
    console.log('[API] ✅ JSON parsed successfully:', url, {
      dataType: typeof data,
      keys: Object.keys(data || {}),
      data
    }); 
    return data;
  } catch (e) { 
    clearTimeout(t); 
    console.error('[API] 💥 Request failed:', url, {
      error: e.message,
      stack: e.stack,
      name: e.name
    }); 
    throw e; 
  }
}

async function loadProfile() {
  console.log('👤 Starting profile load process...');
  
  try {
    console.log('🔍 Resolving user...');
    const username = await resolveUser();
    console.log('✅ User resolved:', username);
    
    if (!username) {
      console.error('❌ No username resolved - cannot proceed');
      throw new Error('No user specified');
    }
    
    const base = 'https://api.websim.com/api/v1';
    let statsSet = false;
    
    console.log('📊 Loading user details for:', username);
    
    // Load user details
    try {
      const user = await fetchJSON(`${base}/users/${username}`);
      console.log('👤 User data received:', user);
      
      const u = user?.user ?? user ?? { username };
      console.log('👤 Processed user object:', u);
      
      $('username').textContent = u.username || username;
      $('avatar').src = u.avatar_url || '';
      $('avatar').alt = `${u.username} avatar`;
      $('joined').textContent = u.created_at ? `Joined ${dayjs(u.created_at).format('MMM D, YYYY')}` : '';
      $('viewOnWebsim').href = `https://websim.ai/@${u.username}`;
      $('followersCount').textContent = formatNum(u.followers_count ?? 0);
      $('followingCount').textContent = formatNum(u.following_count ?? 0);
      
      console.log('✅ User UI updated with basic info');
    } catch (userError) {
      console.error('❌ Failed to load user details:', userError);
      // Continue with username only
      $('username').textContent = username;
      $('viewOnWebsim').href = `https://websim.ai/@${username}`;
    }

    // Load user stats
    console.log('📈 Loading user stats...');
    fetchJSON(`${base}/users/${username}/stats`).then(stats => {
      console.log('📈 Stats data received:', stats);
      $('projectsCount').textContent = formatNum(stats.projects);
      $('viewsCount').textContent = formatNum(stats.views);
      $('likesCount').textContent = formatNum(stats.likes);
      $('commentsCount').textContent = formatNum(stats.comments);
      $('followersCount').textContent = formatNum(stats.followers ?? u.followers_count ?? 0);
      $('followingCount').textContent = formatNum(stats.following ?? u.following_count ?? 0);
      statsSet = true;
      console.log('✅ Stats UI updated');
    }).catch(statsError => { 
      console.error('❌ Failed to load stats:', statsError);
    });

    // Load user projects
    console.log('📋 Loading user projects...');
    fetchJSON(`${base}/users/${username}/projects?first=12`).then(projects => {
      console.log('📋 Projects data received:', projects);
      
      const list = (projects.projects?.data || []).map(p => p.project || p);
      console.log('📋 Processed projects list:', list);
      
      const wrap = $('projects'); 
      wrap.innerHTML = '';
      
      list.forEach((p, index) => {
        console.log(`📋 Processing project ${index + 1}:`, p);
        const card = document.createElement('a');
        card.className = 'project-card';
        card.href = `https://websim.ai${p.link_url || `/@${username}/slugs/${p.slug}`}`;
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
      
      console.log('✅ Projects UI updated with', list.length, 'projects');
      
      if (!statsSet) {
        console.log('📊 Calculating aggregate stats from projects...');
        const agg = list.reduce((a, p) => {
          const s = p.stats || {}; 
          a.views += s.views || 0; 
          a.likes += s.likes || 0; 
          a.comments += s.comments || 0; 
          return a;
        }, { views: 0, likes: 0, comments: 0 });
        
        console.log('📊 Aggregate stats calculated:', agg);
        
        $('projectsCount').textContent = formatNum(list.length);
        $('viewsCount').textContent = formatNum(agg.views);
        $('likesCount').textContent = formatNum(agg.likes);
        $('commentsCount').textContent = formatNum(agg.comments);
        
        console.log('✅ Aggregate stats UI updated');
      }
    }).catch(projectsError => { 
      console.error('❌ Failed to load projects:', projectsError);
    });
    
  } catch (e) {
    console.error('💥 Profile loading failed completely:', e);
    throw e;
  }
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