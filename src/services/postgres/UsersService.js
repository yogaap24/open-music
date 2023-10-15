const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    await this.verifyNewUsername(username);

    const id = `user-${nanoid(16)}`;
    const secretPassword = await bcrypt.hash(password, 10);

    const result = await this._pool.query({
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, secretPassword, fullname],
    });

    if (!result.rowCount) {
      throw new InvariantError('Failed to add user');
    }
    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    const result = await this._pool.query({
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    });
    if (result.rowCount > 0) {
      throw new InvariantError(
        'Failed to add user. Username already in use.'
      );
    }
  }

  async getUserById(userId) {
    const result = await this._pool.query({
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    });

    if (!result.rowCount) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  async verifyUserCredential(username, password) {
    const result = await this._pool.query({
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    });

    if (!result.rowCount) {
      throw new AuthenticationError('You provided incorrect credentials');
    }

    const { id, password: secretPassword } = result.rows[0];

    const match = await bcrypt.compare(password, secretPassword);

    if (!match) {
      throw new AuthenticationError('You provided incorrect credentials');
    }
    return id;
  }

  async getUsersByUsername(username) {
    const result = await this._pool.query({
      text: 'SELECT id, username, fullname FROM users WHERE username LIKE $1',
      values: [`%${username}%`],
    });
    return result.rows;
  }
}

module.exports = UsersService;
