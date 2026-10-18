# muzica.dz

A lightweight music library and upload application for Algerian and international tracks.

## Features
- Upload music files directly from your device
- Store metadata such as title, artist, album, genre, language, and country
- Browse the uploaded library in the browser
- Play tracks using the built-in audio player
- Ready for later cloud storage integration (S3, Cloud Storage, Spaces)

## Local setup

1. Install dependencies
   npm install

2. Start the server
   npm start

3. Open the app in the browser
   http://localhost:3000

## Project structure
- server.js — Express backend and upload API
- public/ — frontend HTML, CSS, and JavaScript
- uploads/ — uploaded audio files
- data/songs.json — song metadata storage

## Upload notes
- Supported files: audio files (mp3, wav, ogg, m4a)
- Maximum file size: 200 MB
- Uploaded files are stored locally by default
