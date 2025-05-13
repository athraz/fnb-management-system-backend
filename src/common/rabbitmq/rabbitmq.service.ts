import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService {
    private connection: amqp.Connection;
    private channel: amqp.Channel;

    constructor() {
        this.connect();
    }

    private async connect() {
        try {
            const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
            this.connection = await amqp.connect(rabbitUrl);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue('menu_updates', { durable: true });
            await this.channel.assertQueue('order_updates', { durable: true });
        } catch (error) {
            console.error('Error connecting to RabbitMQ:', error);
        }
    }

    async publishMenuUpdate(message: string) {
        if (this.channel) {
            this.channel.sendToQueue('menu_updates', Buffer.from(message), {
                persistent: true,
            });
        }
    }

    async publishOrderUpdate(message: string) {
        if (this.channel) {
            this.channel.sendToQueue('order_updates', Buffer.from(message), {
                persistent: true,
            });
        }  
    }
}
