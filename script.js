let tracks = []; // Треки будут загружены из JSON
let playlists = JSON.parse(localStorage.getItem("playlists")) || [];

const trackGrid = document.getElementById("track-grid");
const audioPlayer = document.getElementById("audio");
const playPauseButton = document.getElementById("play-pause");
const currentTrack = document.getElementById("current-track");
const volumeSlider = document.getElementById("volume-slider");
const muteButton = document.getElementById("mute");
const progressBar = document.getElementById("progress");
const playlistGrid = document.getElementById("playlist-grid");

let currentTrackIndex = 0;

// Загрузка треков из JSON
async function loadTracks() {
    try {
        const response = await fetch("tracks.json");
        if (!response.ok) {
            throw new Error("Ошибка загрузки треков: " + response.status);
        }
        const data = await response.json();
        console.log("Треки загружены:", data);
        tracks = data;
        renderTracks();
    } catch (error) {
        console.error("Ошибка загрузки треков:", error);
    }
}

// Отображение треков на странице
function renderTracks() {
    if (!tracks.length) {
        console.error("Треки не загружены или пусты.");
        return;
    }
    trackGrid.innerHTML = tracks.map((track, index) => `
        <div class="track-card" data-audio="${track.audio}" data-index="${index}">
            <img src="${track.cover}" alt="${track.title}">
            <h3>${track.title}</h3>
            <p>${track.artist}</p>
            <button class="add-to-playlist" title="Добавить в плейлист">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `).join("");
}

// Воспроизведение трека
function playTrack(audioSrc, title) {
    audioPlayer.src = audioSrc;
    audioPlayer.play();
    currentTrack.textContent = title;
    playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
}

// Обработчик клика на трек
trackGrid.addEventListener("click", (e) => {
    const trackCard = e.target.closest(".track-card");
    if (trackCard && !e.target.classList.contains("add-to-playlist")) {
        const audioSrc = trackCard.getAttribute("data-audio");
        const title = trackCard.querySelector("h3").textContent;
        playTrack(audioSrc, title);
    }
});

// Обработчик клика на треки в плейлистах
playlistGrid.addEventListener("click", (e) => {
    const trackCard = e.target.closest(".track-card");
    if (trackCard && !e.target.classList.contains("remove-from-playlist")) {
        const audioSrc = trackCard.getAttribute("data-audio");
        const title = trackCard.querySelector("h3").textContent;
        playTrack(audioSrc, title);
    }
});

// Управление воспроизведением
playPauseButton.addEventListener("click", () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audioPlayer.pause();
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    }
});

// Управление громкостью
volumeSlider.addEventListener("input", () => {
    audioPlayer.volume = volumeSlider.value;
    localStorage.setItem("volume", volumeSlider.value);
    if (audioPlayer.volume === 0) {
        muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
});

// Кнопка mute/unmute
muteButton.addEventListener("click", () => {
    if (audioPlayer.volume > 0) {
        audioPlayer.volume = 0;
        volumeSlider.value = 0;
        muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        audioPlayer.volume = 1;
        volumeSlider.value = 1;
        muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
});

// Прогресс трека
audioPlayer.addEventListener("timeupdate", () => {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progress;
});

progressBar.addEventListener("input", () => {
    const time = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;
});

// Переключение на следующий трек
function playNextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    const track = tracks[currentTrackIndex];
    playTrack(track.audio, track.title);
}

// Переключение на предыдущий трек
function playPrevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    const track = tracks[currentTrackIndex];
    playTrack(track.audio, track.title);
}

// Обработчики для кнопок "следующий" и "предыдущий"
document.getElementById("next").addEventListener("click", playNextTrack);
document.getElementById("prev").addEventListener("click", playPrevTrack);

// Создание плейлиста
const createPlaylistButton = document.getElementById("create-playlist");
createPlaylistButton.addEventListener("click", () => {
    const playlistName = prompt("Введите название плейлиста:");
    if (playlistName) {
        playlists.push({ name: playlistName, tracks: [] });
        updatePlaylists();
        savePlaylists();
    }
});

// Обновление списка плейлистов
function updatePlaylists() {
    playlistGrid.innerHTML = playlists.map((playlist, index) => `
        <div class="playlist-card">
            <h3>
                <div class="playlist-header">
                    <span>${playlist.name}</span>
                    <button class="delete-playlist" onclick="deletePlaylistWithConfirmation(${index})" title="Удалить плейлист">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <span class="toggle-tracks">▼</span>
            </h3>
            <div class="playlist-tracks">
                ${playlist.tracks.map(trackIndex => `
                    <div class="track-card" data-audio="${tracks[trackIndex].audio}">
                        <img src="${tracks[trackIndex].cover}" alt="${tracks[trackIndex].title}">
                        <h3>${tracks[trackIndex].title}</h3>
                        <p>${tracks[trackIndex].artist}</p>
                        <button class="remove-from-playlist" onclick="removeTrackFromPlaylist(${index}, ${trackIndex}, event)">
                            Удалить
                        </button>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");

    // Добавляем обработчики для стрелочек
    document.querySelectorAll(".playlist-card h3").forEach(header => {
        header.addEventListener("click", (e) => {
            // Проверяем, что клик был не по кнопке удаления
            if (!e.target.classList.contains("delete-playlist")) {
                const tracksSection = header.nextElementSibling;
                const toggleIcon = header.querySelector(".toggle-tracks");
                tracksSection.classList.toggle("visible");
                toggleIcon.classList.toggle("collapsed");
            }
        });
    });
}

// Удаление плейлиста с подтверждением
function deletePlaylistWithConfirmation(index) {
    const playlistName = playlists[index].name;
    const isConfirmed = confirm(`Вы уверены, что хотите удалить плейлист "${playlistName}"?`);
    if (isConfirmed) {
        playlists.splice(index, 1);
        updatePlaylists();
        savePlaylists();
    }
}

// Удаление трека из плейлиста
function removeTrackFromPlaylist(playlistIndex, trackIndex, event) {
    event.stopPropagation(); // Останавливаем всплытие события
    const playlist = playlists[playlistIndex];
    playlist.tracks = playlist.tracks.filter(index => index !== trackIndex);
    updatePlaylists();
    savePlaylists();
}

// Добавление трека в плейлист
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-playlist")) {
        e.stopPropagation(); // Останавливаем всплытие события
        const trackCard = e.target.closest(".track-card");
        const trackIndex = trackCard.getAttribute("data-index");

        if (playlists.length === 0) {
            alert("Сначала создайте плейлист!");
            return;
        }

        const playlistName = prompt("Введите название плейлиста, в который хотите добавить трек:");
        const playlist = playlists.find(p => p.name === playlistName);

        if (playlist) {
            if (!playlist.tracks.includes(Number(trackIndex))) {
                playlist.tracks.push(Number(trackIndex));
                updatePlaylists();
                savePlaylists();
                alert(`Трек "${tracks[trackIndex].title}" добавлен в плейлист "${playlistName}"`);
            } else {
                alert("Этот трек уже есть в плейлисте!");
            }
        } else {
            alert("Плейлист не найден!");
        }
    }
});

// Сохранение плейлистов в localStorage
function savePlaylists() {
    localStorage.setItem("playlists", JSON.stringify(playlists));
}

// Переключение вкладок
document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
        button.classList.add("active");
        const tabId = button.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");
    });
});

// Загрузка громкости из localStorage
const savedVolume = localStorage.getItem("volume");
if (savedVolume) {
    audioPlayer.volume = parseFloat(savedVolume);
    volumeSlider.value = savedVolume;
}

// Автоматическое воспроизведение следующего трека
audioPlayer.addEventListener("ended", playNextTrack);

// Загрузка треков и плейлистов при загрузке страницы
window.onload = async () => {
    await loadTracks();
    updatePlaylists();
};