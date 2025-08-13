const apiKey = "oH-AmZ2OPcd4sUJbzU0lptZdlIWZj0dHCySazIA".split("").reverse().join("");

// Tab switching
document.querySelectorAll(".tab-link").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
        link.classList.add("active");
        document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
        document.getElementById(link.dataset.tab).classList.add("active");
    });
});

// Preloaded songs on page load
window.onload = function() {
    loadPreloadedSongs();
};

function loadPreloadedSongs() {
    showLoading();
    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=trending music&type=video&key=${apiKey}`)
        .then(res => res.json())
        .then(data => displayResults(data.items));
}

function searchSongs() {
    const query = document.getElementById("search").value;
    showLoading();
    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`)
        .then(res => res.json())
        .then(data => displayResults(data.items));
}

function displayResults(items) {
    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    items.forEach(item => {
        let videoId = item.id.videoId;
        let title = item.snippet.title;
        let thumbnail = item.snippet.thumbnails.medium.url;
        let div = document.createElement("div");
        div.className = "song";
        div.innerHTML = `<img src="${thumbnail}" width="100%" /><p>${title}</p>`;
        div.onclick = () => playSong(videoId, title, thumbnail);
        resultsDiv.appendChild(div);
    });
}

function playSong(videoId, title, thumbnail) {
    document.getElementById("song-title").innerText = title;
    document.getElementById("song-thumbnail").src = thumbnail;
    document.getElementById("player").innerHTML = `<iframe width="300" height="80" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
}

function showLoading() {
    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
              }
