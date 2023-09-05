const mapAlbumsDBToModel = ({ ...args }) => ({
  ...args,
});

const mapSongsDBToModel = ({ album_id, ...args }) => ({
  ...args,
  albumId: album_id,
});

module.exports = { mapAlbumsDBToModel, mapSongsDBToModel };
