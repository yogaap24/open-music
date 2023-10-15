const mapAlbumsDBToModel = ({ cover_url, ...args }) => ({
  ...args,
  coverUrl: cover_url,
});

const mapSongsDBToModel = ({ album_id, ...args }) => ({
  ...args,
  albumId: album_id,
});

const shortSongs = ({ id, title, performer }) => ({
  id,
  title,
  performer,
});

module.exports = { mapAlbumsDBToModel, mapSongsDBToModel, shortSongs };
