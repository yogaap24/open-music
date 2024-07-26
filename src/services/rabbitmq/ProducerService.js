const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const config = require('../../utils/config');

const ProducerService = {
  sendMessage: async (queue, message) => {
    const options = {
      cert: fs.readFileSync(path.resolve(__dirname, '../rabbitmq/certs/new-cert.pem')),
      key: fs.readFileSync(path.resolve(__dirname, '../rabbitmq/certs/new-key.pem')),
      ca: [fs.readFileSync(path.resolve(__dirname, '../rabbitmq/certs/ca-cert.pem'))],
      rejectUnauthorized: true,
    };
    const connection = await amqp.connect(config.rabbitMq.server, options).then((conn) => {
      fs.appendFileSync(path.resolve(__dirname, '../../logs/app.log'), `${new Date().toLocaleString()} [RabbitMQ] Connection successful\n`);
      return conn;
    }).catch((err) => {
      fs.appendFileSync(path.resolve(__dirname, '../../logs/error.log'), `${new Date().toLocaleString()} [RabbitMQ] Connection failed: ${err.stack}\n`);
      throw err;
    });
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
      durable: true,
    });

    await channel.sendToQueue(queue, Buffer.from(message));

    setTimeout(() => {
      connection.close();
    }, 1000);
  },
};

module.exports = ProducerService;
