const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(albumsService, albumsValidator, storageService, uploadsValidator) {
    this._albumsService = albumsService;
    this._albumsValidator = albumsValidator;
    this._storageService = storageService;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._albumsValidator.validateAlbumsPayload(request.payload);

    const albumId = await this._albumsService.addAlbum(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album added successfully',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler(h) {
    const albums = await this._albumsService.getAlbums();

    const response = h.response({
      status: 'success',
      data: {
        albums,
      },
    });
    response.code(200);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);

    const response = h.response({
      status: 'success',
      data: {
        album,
      },
    });
    response.code(200);
    return response;
  }

  async putAlbumByIdHandler(request, h) {
    this._albumsValidator.validateAlbumsPayload(request.payload);
    const { id } = request.params;
    await this._albumsService.editAlbumById(id, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album update successfully',
    });
    response.code(200);
    return response;
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;

    const album = await this._albumsService.getAlbumById(id);

    if (album.coverUrl != null) {
      const fileName = album.coverUrl.split('/').slice(-1)[0];
      await this._storageService.deleteFile(fileName);
    }

    await this._albumsService.deleteAlbumById(id);

    const response = h.response({
      status: 'success',
      message: 'Album delete successfully',
    });
    response.code(200);
    return response;
  }

  async postUploadImageHandler(req, h) {
    const { id } = req.params;
    const { cover } = req.payload;

    await this._albumsService.isAlbumExist(id);
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    const fileLocation = await this._storageService.writeFile(cover, cover.hapi);
    await this._albumsService.editAlbumCoverById(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Cover image added successfully',
    });
    response.code(201);
    return response;
  }

  async postLikesAlbumHandler(req, h) {
    const { id } = req.params;
    const { id: credentialId } = req.auth.credentials;

    const message = await this._albumsService.likeTheAlbum(id, credentialId);
    const response = h.response({
      status: 'success',
      message,
    });
    response.code(201);
    return response;
  }

  async deleteLikesAlbumHandler(req, h) {
    const { id } = req.params;
    const { id: credentialId } = req.auth.credentials;

    const message = await this._albumsService.unlikeTheAlbum(id, credentialId);
    const response = h.response({
      status: 'success',
      message,
    });
    response.code(200);
    return response;
  }

  async getAlbumLikesByIdHandler(req, h) {
    const { id } = req.params;
    const { likes, source } = await this._albumsService.getAlbumLikesById(id);
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    response.header('X-Data-Source', source);
    response.code(200);
    return response;
  }
}

module.exports = AlbumsHandler;
