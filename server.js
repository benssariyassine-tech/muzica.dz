const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const uploadsDir = path.join(rootDir, 'uploads');
const dataDir = path.join(rootDir, 'data');
const songsFilePath = path.join(dataDir, 'songs.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(rootDir, 'public')));

function ensureDirs() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(songsFilePath)) {
    fs.writeFileSync(songsFilePath, JSON.stringify([], null, 2), 'utf8');
  }
}

function readSongs() {
  try {
    const data = fs.readFileSync(songsFilePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveSongs(songs) {
  fs.writeFileSync(songsFilePath, JSON.stringify(songs, null, 2), 'utf8');
}

function sanitizeFileName(filename) {
  return filename
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const extension = path.extname(file.originalname) || '.mp3';
    const baseName = sanitizeFileName(path.basename(file.originalname, extension));
    cb(null, `${Date.now()}-${baseName}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024
  },
  fileFilter: function (_req, file, cb) {
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed'));
    }
    cb(null, true);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'muzica.dz is running' });
});

app.get('/api/songs', (_req, res) => {
  const songs = readSongs();
  res.json(songs);
});

app.get('/api/songs/:id', (req, res) => {
  const song = readSongs().find((item) => item.id === req.params.id);
  if (!song) {
    return res.status(404).json({ message: 'Song not found' });
  }
  res.json(song);
});

app.post('/api/songs', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an audio file' });
    }

    const songs = readSongs();

    const song = {
      id: uuidv4(),
      title: req.body.title || path.basename(req.file.filename, path.extname(req.file.filename)),
      artist: req.body.artist || 'Unknown artist',
      album: req.body.album || 'Single',
      genre: req.body.genre || 'General',
      language: req.body.language || 'Arabic',
      country: req.body.country || 'DZ',
      coverUrl: req.body.coverUrl || '',
      notes: req.body.notes || '',
      file: `/uploads/${req.file.filename}`,
      createdAt: new Date().toISOString()
    };

    songs.unshift(song);
    saveSongs(songs);

    res.status(201).json(song);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save song', error: error.message });
  }
});

app.delete('/api/songs/:id', (req, res) => {
  const songs = readSongs();
  const target = songs.find((song) => song.id === req.params.id);

  if (!target) {
    return res.status(404).json({ message: 'Song not found' });
  }

  const remainingSongs = songs.filter((song) => song.id !== req.params.id);
  saveSongs(remainingSongs);

  if (target.file) {
    const filePath = path.join(rootDir, target.file.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  res.json({ message: 'Song deleted successfully' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

ensureDirs();

app.listen(PORT, () => {
  console.log(`muzica.dz is running on http://localhost:${PORT}`);
});
