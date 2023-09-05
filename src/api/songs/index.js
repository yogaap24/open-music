const SongsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'songs',
  version: '1.0.0',
  register: async (server, { service, validation }) => {
    const songsHandler = new SongsHandler(service, validation);
    server.route(routes(songsHandler));
  }
};
