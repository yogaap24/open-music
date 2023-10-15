const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { mapSongsDBToModel } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, performer, genre, duration, albumId
  }) {
    const id = `song-${nanoid(16)}`;

    const result = await this._pool.query({
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, performer, genre, duration, albumId],
    });

    if (!result.rowCount) {
      throw new InvariantError('Failed to add song');
    }

    return result.rows[0].id;
  }

  async getSongs(title, performer) {
    let query = '';
    if (title && performer) {
      query = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER(title) LIKE $1 AND LOWER(performer) LIKE $2',
        values: [`%${title.toLowerCase()}%`, `%${performer.toLowerCase()}%`],
      };
    } else if (title) {
      query = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER(title) LIKE $1',
        values: [`%${title.toLowerCase()}%`],
      };
    } else if (performer) {
      query = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER(performer) LIKE $1',
        values: [`%${performer.toLowerCase()}%`],
      };
    } else {
      query = {
        text: 'SELECT id, title, performer FROM songs',
      };
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getSongById(id) {
    const result = await this._pool.query({
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Song not found');
    }

    return result.rows.map(mapSongsDBToModel)[0];
  }

  async editSongById(id, {
    title, year, performer, genre, duration, albumId
  }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id',
      values: [title, year, performer, genre, duration, albumId, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update song. Id not found');
    }
  }

  async deleteSongById(id) {
    const result = await this._pool.query({
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete song. Id not found');
    }
  }
}

module.exports = SongsService;
