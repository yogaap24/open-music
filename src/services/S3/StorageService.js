const Minio = require('minio');
const config = require('../../utils/config');

class StorageService {
  constructor() {
    this._client = new Minio.Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }

  async writeFile(file, meta) {
    const bucketName = 'open-music';
    const objectName = `${+new Date()}-${meta.filename}`;

    try {
      await this._client.putObject(
        bucketName,
        objectName,
        file._data,
        meta.headers['content-type']
      );
      return `http://${config.minio.endPoint}:${config.minio.port}/${bucketName}/${objectName}`;
    } catch (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
  }

  async deleteFile(objectName) {
    const bucketName = 'open-music';

    try {
      await this._client.removeObject(bucketName, objectName);
    } catch (error) {
      throw new Error(`Error deleting file: ${error.message}`);
    }
  }
}

module.exports = StorageService;
