const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { mapAlbumsDBToModel } = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to add album');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapAlbumsDBToModel);
  }

  async getAlbumById(id) {
    const result = await this._pool.query({
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Album not found');
    }

    const resultSongs = await this._pool.query({
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    });

    return {
      ...result.rows.map(mapAlbumsDBToModel)[0],
      songs: resultSongs.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update album. Id not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete album. Id not found');
    }
  }

  async editAlbumCoverById(id, fileLocation) {
    await this._pool.query({
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [fileLocation, id],
    });
  }

  async isAlbumExist(id) {
    const result = await this._pool.query({
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Album not found');
    }
  }

  async likeTheAlbum(id, userId) {
    await this.isAlbumExist(id);

    const result = await this._pool.query({
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [id, userId],
    });

    let message = '';
    if (!result.rowCount) {
      const resultInsert = await this._pool.query({
        text: 'INSERT INTO user_album_likes (album_id, user_id) VALUES($1, $2) RETURNING id',
        values: [id, userId],
      });

      if (!resultInsert.rowCount) {
        throw new InvariantError('Failed to like the album');
      }
      message = 'Successfully liked the album';
    }

    if (result.rowCount) {
      throw new InvariantError('You already liked this album');
    }

    await this._cacheService.delete(`user_album_likes:${id}`);
    return message;
  }

  async unlikeTheAlbum(id, userId) {
    await this.isAlbumExist(id);

    const result = await this._pool.query({
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [id, userId],
    });

    let message = '';
    if (result.rowCount) {
      const resultDelete = await this._pool.query({
        text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
        values: [id, userId],
      });

      if (!resultDelete.rowCount) {
        throw new InvariantError('Failed to unlike the album');
      }
      message = 'Successfully unliked the album';
    }
    await this._cacheService.delete(`user_album_likes:${id}`);
    return message;
  }

  async getAlbumLikesById(id) {
    try {
      const source = 'cache';
      const likes = await this._cacheService.get(`user_album_likes:${id}`);
      return { likes: +likes, source };
    } catch (error) {
      await this.isAlbumExist(id);

      const result = await this._pool.query({
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      });

      const likes = result.rowCount;
      await this._cacheService.set(`user_album_likes:${id}`, likes);
      const source = 'server';

      return { likes, source };
    }
  }
}

module.exports = AlbumsService;
