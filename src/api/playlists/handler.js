const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistsService, songsService, validator) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(req, h) {
    this._validator.validatePostPlaylistPayload(req.payload);
    const { name } = req.payload;
    const { id: credentialId } = req.auth.credentials;

    const playlistId = await this._playlistsService.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist added successfully',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(req, h) {
    const { id: credentialId } = req.auth.credentials;
    const playlists = await this._playlistsService.getPlaylists(credentialId);
    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });
    response.code(200);
    return response;
  }

  async deletePlaylistByIdHandler(req, h) {
    const { playlistId } = req.params;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this._playlistsService.deletePlaylistById(playlistId);

    const response = h.response({
      status: 'success',
      message: 'Playlist delete successfully',
    });
    response.code(200);
    return response;
  }

  async postSongHandler(req, h) {
    this._validator.validatePostSongPayload(req.payload);
    const { playlistId } = req.params;
    const { songId } = req.payload;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._songsService.getSongById(songId);

    await this._playlistsService.addSongToPlaylist(playlistId, songId);

    const action = 'add';
    await this._playlistsService.addActivityToPlaylist(
      playlistId,
      songId,
      credentialId,
      action
    );

    const response = h.response({
      status: 'success',
      message: 'Song successfully add to playlist',
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(req, h) {
    const { playlistId } = req.params;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);

    const playlist = await this._playlistsService.getSongsFromPlaylist(
      playlistId
    );

    const response = h.response({
      status: 'success',
      data: {
        playlist,
      },
    });
    response.code(200);
    return response;
  }

  async deleteSongByIdHandler(req, h) {
    const { playlistId } = req.params;
    const { songId } = req.payload;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistsService.deleteSongFromPlaylist(playlistId, songId);

    const action = 'delete';
    await this._playlistsService.addActivityToPlaylist(
      playlistId,
      songId,
      credentialId,
      action
    );

    const response = h.response({
      status: 'success',
      message: 'Song successfully delete from playlist',
    });
    response.code(200);
    return response;
  }

  async getActivitiesHandler(req, h) {
    const { playlistId } = req.params;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);

    const activities = await this._playlistsService.getActivitiesFromPlaylist(
      playlistId
    );
    const response = h.response({
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    });
    response.code(200);
    return response;
  }
}

module.exports = PlaylistsHandler;
