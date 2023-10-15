const autoBind = require('auto-bind');

class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    autoBind(this);
  }

  async postAuthenticationHandler(req, h) {
    this._validator.validatePostAuthenticationPayload(req.payload);

    const { username, password } = req.payload;
    const id = await this._usersService.verifyUserCredential(
      username,
      password
    );

    const accessToken = this._tokenManager.generateAccessToken({
      id,
    });
    const refreshToken = this._tokenManager.generateRefreshToken({
      id,
    });

    await this._authenticationsService.addRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      message: 'Auth added successfully',
      data: {
        accessToken,
        refreshToken,
      },
    });
    response.code(201);
    return response;
  }

  async putAuthenticationHandler(req, h) {
    this._validator.validatePutAuthenticationPayload(req.payload);

    const { refreshToken } = req.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

    const accessToken = this._tokenManager.generateAccessToken({
      id,
    });

    const response = h.response({
      status: 'success',
      message: 'Access Token update successfully',
      data: {
        accessToken,
      },
    });
    response.code(200);
    return response;
  }

  async deleteAuthenticationHandler(req, h) {
    this._validator.validateDeleteAuthenticationPayload(req.payload);

    const { refreshToken } = req.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      message: 'Access Token delete successfully',
    });
    response.code(200);
    return response;
  }
}

module.exports = AuthenticationsHandler;
