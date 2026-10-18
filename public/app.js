const songList = document.getElementById('songList');
const songForm = document.getElementById('songForm');
const statusPill = document.getElementById('statusPill');
const refreshBtn = document.getElementById('refreshBtn');
const audioPlayer = document.getElementById('audioPlayer');
const nowPlaying = document.getElementById('nowPlaying');

async function loadSongs() {
  try {
    statusPill.textContent = 'جارٍ التحميل...';
    const res = await fetch('/api/songs');
    const songs = await res.json();

    renderSongs(songs);
    statusPill.textContent = songs.length ? 'جاهز' : 'فارغ';
  } catch (error) {
    statusPill.textContent = 'خطأ';
    songList.innerHTML = '<p>تعذّر تحميل المكتبة. حاول مرة أخرى.</p>';
    console.error(error);
  }
}

function renderSongs(songs) {
  if (!songs.length) {
    songList.innerHTML = '<p>لا توجد أغاني مرفوعة حتى الآن.</p>';
    return;
  }

  songList.innerHTML = songs
    .map((song) => {
      const title = song.title || 'بدون عنوان';
      const artist = song.artist || 'غير معروف';
      const genre = song.genre || 'عام';
      const country = song.country || 'DZ';
      const shortTitle = title.slice(0, 1).toUpperCase();

      return `
        <article class="song-card" data-id="${song.id}">
          <div class="cover-art">${shortTitle}</div>
          <div class="song-meta">
            <h3>${title}</h3>
            <p>${artist} • ${genre} • ${country}</p>
          </div>
          <div class="song-actions">
            <button class="play-btn" type="button" data-id="${song.id}" data-file="${song.file || ''}">تشغيل</button>
            <button class="delete-btn" type="button" data-id="${song.id}">حذف</button>
          </div>
        </article>
      `;
    })
    .join('');
}

songList.addEventListener('click', async (event) => {
  const target = event.target;

  if (target.classList.contains('play-btn')) {
    const id = target.dataset.id;
    const file = target.dataset.file;

    if (!file) {
      alert('لا يوجد ملف صوتي مرتبط بهذه الأغنية بعد.');
      return;
    }

    const song = (await fetch('/api/songs').then((res) => res.json())).find((item) => item.id === id);

    if (!song) return;

    nowPlaying.innerHTML = `
      <p class="label">التشغيل الآن</p>
      <h3>${song.title}</h3>
      <p>${song.artist} • ${song.genre}</p>
    `;

    audioPlayer.src = song.file;
    audioPlayer.play();
    return;
  }

  if (target.classList.contains('delete-btn')) {
    const id = target.dataset.id;
    const confirmed = window.confirm('هل تريد حذف هذه الأغنية؟');

    if (!confirmed) return;

    const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadSongs();
      if (audioPlayer.src.includes(id)) {
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
      }
    } else {
      alert('تعذر حذف الأغنية.');
    }
  }
});

songForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(songForm);
  const fileInput = document.getElementById('audioFile');

  if (!fileInput.files.length) {
    alert('يرجى اختيار ملف صوتي أولاً');
    return;
  }

  statusPill.textContent = 'جارٍ الرفع...';

  try {
    const res = await fetch('/api/songs', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || 'Unexpected error');
    }

    songForm.reset();
    loadSongs();
    statusPill.textContent = 'تم الرفع بنجاح';
  } catch (error) {
    statusPill.textContent = 'خطأ';
    alert(error.message || 'تعذّر رفع الأغنية');
  }
});

refreshBtn.addEventListener('click', loadSongs);

loadSongs();
