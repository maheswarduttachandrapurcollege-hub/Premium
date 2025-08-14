// ---- CONFIG ----
// Use your Cloudflare Worker (recommended). If you prefer direct API, set workerURL to "" and fill apiKey.
const workerURL = "https://lively-field-097a.00simpleuse.workers.dev"; // <- your Worker
const apiKey = ""; // If not using Worker, put your YouTube Data API v3 key here.
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

function loadSongs(query){
  showLoading();

  const url = workerURL && workerURL.trim().length
    ? `${workerURL}/?q=${encodeURIComponent(query)}`
    : `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=18&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const items = data.items || [];
      renderGrid(items);
      // Autoplay the first result into the top music box
      if (items.length){
        const first = items[0];
        const vid = getVideoId(first);
        const title = first.snippet?.title || "Untitled";
        const thumb = first.snippet?.thumbnails?.high?.url || first.snippet?.thumbnails?.medium?.url;
        playSong(vid, title, thumb, /*autoplay*/ false); // don't auto play sound without click
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
  loadSongs(q);
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
    card.addEventListener("click", () => playSong(vid, title, thumb, true));
    container.appendChild(card);
  }
}

function playSong(videoId, title, thumbnail, allowAutoplay){
  document.getElementById("song-title").innerText = title;
  document.getElementById("song-thumbnail").src = thumbnail || document.getElementById("song-thumbnail").src;

  const autoplayParam = allowAutoplay ? "1" : "0";
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}`;

  const frame = document.getElementById("yt-frame");
  // Set src fresh each time to ensure proper playback
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
    "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#39;"
  })[s]);
}
