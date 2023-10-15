/* eslint-disable max-len */
const autoBind = require('auto-bind');

class CollaborationsHandler {
  constructor(
    collaborationsService,
    playlistsService,
    usersService,
    validator
  ) {
    this._collaborationsService = collaborationsService;
    this._playlistsService = playlistsService;
    this._usersService = usersService;
    this._validator = validator;

    autoBind(this);
  }

  async postCollaborationHandler(req, h) {
    this._validator.validateCollaborationPayload(req.payload);
    const { id: credentialId } = req.auth.credentials;
    const { playlistId, userId } = req.payload;

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this._usersService.getUserById(userId);
    const collaborationId = await this._collaborationsService.addCollaboration(
      playlistId,
      userId
    );

    const response = h.response({
      status: 'success',
      message: 'Colaboration added successfully',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(req, h) {
    this._validator.validateCollaborationPayload(req.payload);
    const { id: credentialId } = req.auth.credentials;
    const { playlistId, userId } = req.payload;

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this._collaborationsService.deleteCollaboration(playlistId, userId);

    const response = h.response({
      status: 'success',
      message: 'Colaboration delete successfully',
    });
    response.code(500);
    return response;
  }
}

module.exports = CollaborationsHandler;
