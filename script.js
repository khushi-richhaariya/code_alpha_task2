// Sample data for demonstration
const songs = [
    {
        title: "Tum Hi Ho",
        artist: "Arijit Singh",
        duration: "4:22",
        albumArt: "https://i.imgur.com/1bX5QH6.jpg",
        genre: ["Bollywood", "Romantic"],
        liked: true,
        src: "audio/tum_hi_ho.mp3"
    },
    {
        title: "Shape of You",
        artist: "Ed Sheeran",
        duration: "3:53",
        albumArt: "https://i.imgur.com/2nCt3Sbl.jpg",
        genre: ["Pop"],
        liked: false,
        src: "audio/shape_of_you.mp3"
    },
    {
        title: "Lagdi Lahore Di",
        artist: "Guru Randhawa",
        duration: "3:50",
        albumArt: "https://i.imgur.com/3QnQF2F.jpg",
        genre: ["Bollywood", "Party"],
        liked: false,
        src: "audio/lagdi_lahore_di.mp3"
    }
    // Add more songs as needed
];

let currentSongIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let audio = new Audio();
let progressInterval = null;
let lastShuffleIndex = null;
let filteredSongs = null;

// DOM Elements
const playlistEl = document.getElementById('playlist');
const albumArtEl = document.getElementById('albumArt');
const songTitleEl = document.getElementById('songTitle');
const artistNameEl = document.getElementById('artistName');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressBar = document.getElementById('progressBar');
const progressThumb = document.getElementById('progressThumb');
const progressContainer = document.getElementById('progressContainer');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeControl = document.getElementById('volumeControl');
const favoritesList = document.getElementById('favorites-list');
const visualizer = document.getElementById('visualizer');

// Social Share Popup Logic
const shareBtn = document.getElementById('shareBtn');
const socialSharePopup = document.getElementById('socialSharePopup');
let popupVisible = false;

if (shareBtn && socialSharePopup) {
    shareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        socialSharePopup.style.display = popupVisible ? 'none' : 'block';
        popupVisible = !popupVisible;
    });
    document.addEventListener('click', function(e) {
        if (popupVisible && !socialSharePopup.contains(e.target) && e.target !== shareBtn) {
            socialSharePopup.style.display = 'none';
            popupVisible = false;
        }
    });

    // Set share URLs
    const pageUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out this awesome music on Melodify!");

    const whatsapp = document.getElementById('shareWhatsapp');
    const facebook = document.getElementById('shareFacebook');
    const twitter = document.getElementById('shareTwitter');
    const telegram = document.getElementById('shareTelegram');
    const linkedin = document.getElementById('shareLinkedin');

    if (whatsapp) whatsapp.href = `https://wa.me/?text=${text}%20${pageUrl}`;
    if (facebook) facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
    if (twitter) twitter.href = `https://twitter.com/intent/tweet?text=${text}&url=${pageUrl}`;
    if (telegram) telegram.href = `https://t.me/share/url?url=${pageUrl}&text=${text}`;
    if (linkedin) linkedin.href = `https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${text}`;
}

// Toast notification
function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '40px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(36,38,41,0.95)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 28px';
        toast.style.borderRadius = '2rem';
        toast.style.fontWeight = '600';
        toast.style.fontSize = '1rem';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 24px rgba(127,90,240,0.23)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 1200);
}

// Render Playlist
function renderPlaylist(list = songs) {
    playlistEl.innerHTML = '';
    (list || songs).forEach((song, index) => {
        const li = document.createElement('li');
        li.className = `playlist-item${index === currentSongIndex ? ' active' : ''}`;
        li.dataset.index = index;
        li.innerHTML = `
            <div class="playlist-item-number">${index + 1}</div>
            <div class="playlist-item-info">
                <div class="playlist-item-title">${song.title}</div>
                <div class="playlist-item-artist">${song.artist}</div>
            </div>
            <div class="playlist-item-duration">${song.duration}</div>
            <div class="playlist-item-like${song.liked ? ' active' : ''}" aria-label="Like song" tabindex="0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.281 8.717 2.01L8 2.748z"/>
                </svg>
            </div>
        `;
        playlistEl.appendChild(li);
    });
}
renderPlaylist();

// Render Favorites
function renderFavorites() {
    favoritesList.innerHTML = '';
    songs.filter(song => song.liked).forEach((song) => {
        const li = document.createElement('li');
        li.className = 'favorite-item';
        li.innerHTML = `<span>${song.title} - ${song.artist}</span>`;
        favoritesList.appendChild(li);
    });
}
renderFavorites();

// Load Song
function loadSong(index) {
    const list = filteredSongs || songs;
    const song = list[index];
    audio.src = song.src;
    albumArtEl.src = song.albumArt;
    songTitleEl.textContent = song.title;
    artistNameEl.textContent = song.artist;
    // Genre tags
    const genreTags = document.querySelector('.genre-tags');
    genreTags.innerHTML = song.genre.map(g => `<span class="genre-tag">${g}</span>`).join('');
    // Playlist highlight
    document.querySelectorAll('.playlist-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });
    // Update total time when metadata loaded
    audio.onloadedmetadata = () => {
        totalTimeEl.textContent = formatTime(audio.duration);
        progressBar.style.width = '0%';
        progressThumb.style.left = '0%';
        currentTimeEl.textContent = '0:00';
    };
}
loadSong(currentSongIndex);

// Play/Pause
function playSong() {
    audio.play();
    isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    playBtn.setAttribute('aria-label', 'Pause');
    startProgress();
    document.querySelector('.album-cover').classList.add('playing');
}
function pauseSong() {
    audio.pause();
    isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    playBtn.setAttribute('aria-label', 'Play');
    stopProgress();
    document.querySelector('.album-cover').classList.remove('playing');
}
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
        showToast('Paused');
    } else {
        playSong();
        showToast('Playing');
    }
});

// Next/Prev
function nextSong() {
    let list = filteredSongs || songs;
    if (isShuffle) {
        let next;
        do {
            next = Math.floor(Math.random() * list.length);
        } while (list.length > 1 && next === currentSongIndex);
        currentSongIndex = next;
    } else {
        currentSongIndex = (currentSongIndex + 1) % list.length;
    }
    loadSong(currentSongIndex);
    playSong();
    showToast('Next Song');
}
function prevSong() {
    let list = filteredSongs || songs;
    if (isShuffle) {
        let prev;
        do {
            prev = Math.floor(Math.random() * list.length);
        } while (list.length > 1 && prev === currentSongIndex);
        currentSongIndex = prev;
    } else {
        currentSongIndex = (currentSongIndex - 1 + list.length) % list.length;
    }
    loadSong(currentSongIndex);
    playSong();
    showToast('Previous Song');
}
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);

// Shuffle/Repeat
shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
    showToast(isShuffle ? 'Shuffle On' : 'Shuffle Off');
});
repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
    showToast(isRepeat ? 'Repeat On' : 'Repeat Off');
});

// Playlist click
playlistEl.addEventListener('click', (e) => {
    const item = e.target.closest('.playlist-item');
    // Like button
    if (e.target.closest('.playlist-item-like')) {
        const idx = parseInt(item.dataset.index, 10);
        // Update liked status in main songs array
        const song = (filteredSongs || songs)[idx];
        const mainIdx = songs.findIndex(s => s.title === song.title && s.artist === song.artist);
        songs[mainIdx].liked = !songs[mainIdx].liked;
        renderPlaylist(filteredSongs || songs);
        renderFavorites();
        showToast(songs[mainIdx].liked ? 'Added to Favorites' : 'Removed from Favorites');
        return;
    }
    // Play song
    if (item) {
        currentSongIndex = parseInt(item.dataset.index, 10);
        loadSong(currentSongIndex);
        playSong();
    }
});

// Progress bar
function startProgress() {
    stopProgress();
    progressInterval = setInterval(() => {
        if (!audio.duration) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = percent + '%';
        progressThumb.style.left = percent + '%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }, 300);
}
function stopProgress() {
    clearInterval(progressInterval);
}
audio.addEventListener('ended', () => {
    if (isRepeat) {
        audio.currentTime = 0;
        playSong();
    } else {
        nextSong();
    }
});
progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
    progressBar.style.width = (percent * 100) + '%';
    progressThumb.style.left = (percent * 100) + '%';
});

// Volume
volumeControl.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
    volumeControl.style.background = `linear-gradient(90deg, var(--primary) ${e.target.value}%, var(--tertiary) 100%)`;
});
audio.volume = volumeControl.value / 100;

// Utility
function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Mood selector (filter by genre)
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mood = btn.textContent;
        if (mood === 'All Songs') {
            filteredSongs = null;
            renderPlaylist(songs);
            currentSongIndex = 0;
            loadSong(currentSongIndex);
        } else {
            filteredSongs = songs.filter(song => song.genre.includes(mood));
            renderPlaylist(filteredSongs);
            currentSongIndex = 0;
            loadSong(currentSongIndex);
        }
        showToast(`Showing: ${mood}`);
    });
});

// Playlist tabs
document.querySelectorAll('.playlist-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.playlist-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.playlist-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(tab.dataset.tab + '-section').classList.add('active');
    });
});

// Theme selector
document.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        document.body.setAttribute('data-theme', opt.dataset.theme);
        showToast('Theme changed');
    });
});

// Theme toggle (dark/light)
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        showToast(document.body.classList.contains('dark') ? 'Dark Mode' : 'Light Mode');
    });
}

// Visualizer (simple animated bars)
if (visualizer) {
    visualizer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        visualizer.appendChild(bar);
    }
    function animateVisualizer() {
        if (isPlaying) {
            document.querySelectorAll('.visualizer-bar').forEach(bar => {
                bar.style.height = (30 + Math.random() * 70) + '%';
                bar.style.transition = 'height 0.2s cubic-bezier(.4,2,.3,1)';
                bar.style.background = `linear-gradient(to top, var(--gradient-start), var(--gradient-end))`;
            });
        } else {
            document.querySelectorAll('.visualizer-bar').forEach(bar => {
                bar.style.height = '30%';
            });
        }
        requestAnimationFrame(animateVisualizer);
    }
    animateVisualizer();
}

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
        playBtn.click();
        e.preventDefault();
    }
    if (e.code === 'ArrowRight') nextBtn.click();
    if (e.code === 'ArrowLeft') prevBtn.click();
    if (e.code === 'KeyR') repeatBtn.click();
    if (e.code === 'KeyS') shuffleBtn.click();
});
