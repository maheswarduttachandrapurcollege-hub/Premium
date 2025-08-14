// --- Player & Queue for background-friendly playback ---
let player = null;
let songQueue = [];
let currentIndex = -1;
let apiReady = false;

function onYouTubeIframeAPIReady(){
  apiReady = true;
  player = new YT.Player('yt-player', {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      playsinline: 1
    },
    events: {
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerStateChange(e){
  if (e && e.data === YT.PlayerState.ENDED){
    playNext();
  }
}

function setQueue(items, autoStartFirst){
  songQueue = items.slice();
  if (!songQueue.length) return;
  currentIndex = 0;
  const it = songQueue[0];
  const vid = getVideoId(it);
  const title = it.snippet?.title || "Untitled";
  const thumb = it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.medium?.url;
  updateNowPlaying(title, thumb);
  if (apiReady && player){
    if (autoStartFirst) player.loadVideoById(vid);
    else player.cueVideoById(vid);
  }
}

function playAtIndex(idx, autoplay=true){
  if (!songQueue.length) return;
  currentIndex = (idx + songQueue.length) % songQueue.length;
  const it = songQueue[currentIndex];
  const vid = getVideoId(it);
  const title = it.snippet?.title || "Untitled";
  const thumb = it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.medium?.url;
  updateNowPlaying(title, thumb);
  if (apiReady && player){
    if (autoplay) player.loadVideoById(vid);
    else player.cueVideoById(vid);
  }
}

function playNext(){ playAtIndex(currentIndex + 1, true); }
function playPrev(){ playAtIndex(currentIndex - 1, true); }

function updateNowPlaying(title, thumb){
  document.getElementById("song-title").innerText = title;
  if (thumb) document.getElementById("song-thumbnail").src = thumb;
}


// ---- CONFIG ----
const apiKey = "AIzaSyCHd0jZWIldZtpl0UzbJUs4dcPO2ZmA-Ho";
// ----------------

// Preload query pool (randomized per refresh)
const PRELOAD_QUERIES = [
  "lofi chill", "trending music", "bollywood hits", "edm 2025", "romantic songs",
  "indie pop", "top hindi songs", "punjabi hits", "sad songs", "party mix"
];

document.addEventListener("DOMContentLoaded", () => {
  // Bind search
  document.getElementById("search-btn").addEventListener("click", searchSongs);
  document.getElementById("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchSongs();
  });

  // Preload random set
  const randomQuery = PRELOAD_QUERIES[Math.floor(Math.random() * PRELOAD_QUERIES.length)];
  loadSongs(randomQuery);
});

function loadSongs(query, resetPlayer = true){
  showLoading();

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=18&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const items = data.items || [];
      renderGrid(items);
      if (resetPlayer) { setQueue(items, false); }
      // Autoplay the first result into the top music box
      if (items.length){
        const first = items[0];
        const vid = getVideoId(first);
        const title = first.snippet?.title || "Untitled";
        const thumb = first.snippet?.thumbnails?.high?.url || first.snippet?.thumbnails?.medium?.url;
        playSong(vid, title, thumb, false);
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      document.getElementById("results").innerHTML = `<div class="loading"><span>Could not load songs.</span></div>`;
    });
}

function searchSongs(){
  const q = document.getElementById("search").value.trim();
  if (!q) return;
  loadSongs(q, false);
}

function renderGrid(items){
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!items.length){
    container.innerHTML = '<div class="loading"><span>No results.</span></div>';
    return;
  }

  for (const item of items){
    const vid = getVideoId(item);
    const title = item.snippet?.title || "Untitled";
    const thumb = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img class="thumb" src="${thumb}" alt="${escapeHtml(title)}" />
      <div class="info"><h3 class="title">${escapeHtml(title)}</h3></div>
    `;
    card.addEventListener("click", () => { songQueue = items.slice(); playAtIndex(items.indexOf(item), true); });
    container.appendChild(card);
  }
}

function playSong(videoId, title, thumbnail, allowAutoplay){
  document.getElementById("song-title").innerText = title;
  document.getElementById("song-thumbnail").src = thumbnail || document.getElementById("song-thumbnail").src;

  const autoplayParam = allowAutoplay ? "1" : "0";
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}`;

  const frame = document.getElementById("yt-frame");
  frame.setAttribute("src", src);
}

function getVideoId(item){
  return item?.id?.videoId || item?.id;
}

function showLoading(){
  const container = document.getElementById("results");
  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  })[s]);
}


// Tab switching
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(`tab-${tab}`).classList.add("active");
  });
});

// Feedback form (no backend, just a message)
const fbForm = document.getElementById("feedback-form");
if (fbForm){
  fbForm.addEventListener("submit", function(e){
    e.preventDefault();
    document.getElementById("feedback-status").innerText = "Thanks for your feedback!";
    this.reset();
  });
}

// Back-compat: keep function name but route to player API
function playSong(videoId, title, thumbnail, allowAutoplay){
  updateNowPlaying(title, thumbnail);
  if (window.player){
    if (allowAutoplay) player.loadVideoById(videoId);
    else player.cueVideoById(videoId);
  }
}
