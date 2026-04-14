const axios = require('axios');

const LASTFM_KEY = process.env.LASTFM_API_KEY;
const LASTFM_URL = 'https://ws.audioscrobbler.com/2.0/';

// ─────────────────────────────────────────
// SEARCH ALBUMS
// GET /albums/search?q=thriller
// ─────────────────────────────────────────
const searchAlbums = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const response = await axios.get(LASTFM_URL, {
      params: {
        method:  'album.search',
        album:   q,
        api_key: LASTFM_KEY,
        format:  'json',
        limit,
        page
      }
    });

    const rawAlbums = response.data.results.albummatches.album;

    // ── Clean + filter albums ────────────────────────────────
    const albums = rawAlbums
      .filter(album => album.image[3]['#text'] !== '')   // no image wale hata do
      .map(album => ({
        mbid:   album.mbid   || null,
        name:   album.name,
        artist: album.artist,
        cover:  album.image[3]['#text'],   // 300x300
        url:    album.url
      }));

    res.json({
      success: true,
      query:   q,
      page:    parseInt(page),
      total:   response.data.results['opensearch:totalResults'],
      data:    albums
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// GET ALBUM DETAIL
// GET /albums/detail?artist=Michael+Jackson&album=Thriller
// ─────────────────────────────────────────
const getAlbumDetail = async (req, res) => {
  try {
    const { artist, album, mbid } = req.query;

    if (!mbid && (!artist || !album)) {
      return res.status(400).json({
        success: false,
        message: 'Provide either mbid or artist + album name'
      });
    }

    const response = await axios.get(LASTFM_URL, {
      params: {
        method:  'album.getInfo',
        artist,
        album,
        mbid,
        api_key: LASTFM_KEY,
        format:  'json'
      }
    });

    const a = response.data.album;

    res.json({
      success: true,
      data: {
        mbid:      a.mbid,
        name:      a.name,
        artist:    a.artist,
        cover:     a.image[3]['#text'],
        listeners: a.listeners,
        playcount: a.playcount,
        tags:      a.tags?.tag?.map(t => t.name) || [],
        wiki:      a.wiki?.summary?.replace(/<a.*<\/a>/g, '').trim() || null,
        tracks:    a.tracks?.track?.map(t => ({
          name:     t.name,
          duration: t.duration,
          rank:     t['@attr']?.rank
        })) || []
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// GET TOP ALBUMS BY ARTIST
// GET /albums/top?artist=Adele
// ─────────────────────────────────────────
const getTopAlbums = async (req, res) => {
  try {
    const { artist } = req.query;

    if (!artist) {
      return res.status(400).json({
        success: false,
        message: 'Artist name is required'
      });
    }

    const response = await axios.get(LASTFM_URL, {
      params: {
        method:  'artist.getTopAlbums',
        artist,
        api_key: LASTFM_KEY,
        format:  'json',
        limit:   10
      }
    });

    const albums = response.data.topalbums.album
      .filter(a => a.image[3]['#text'] !== '')
      .map(a => ({
        mbid:      a.mbid   || null,
        name:      a.name,
        artist:    a.artist.name,
        cover:     a.image[3]['#text'],
        playcount: a.playcount
      }));

    res.json({
      success: true,
      artist,
      data:    albums
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// GET CHART — TOP ALBUMS
// GET /albums/chart
// ─────────────────────────────────────────
const getChartTopArtists = async (req, res) => {
  try {
    const response = await axios.get(LASTFM_URL, {
      params: {
        method:  'chart.getTopArtists',
        api_key: LASTFM_KEY,
        format:  'json',
        limit:   10
      }
    });

    const artists = response.data.artists.artist.map(a => ({
      name:      a.name,
      listeners: a.listeners,
      playcount: a.playcount,
      cover:     a.image[3]['#text']
    }));

    res.json({
      success: true,
      data:    artists
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { searchAlbums, getAlbumDetail, getTopAlbums, getChartTopArtists };