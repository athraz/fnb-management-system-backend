import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { TokenModule } from 'src/common/token/token.module';
import { RabbitMQModule } from 'src/common/rabbitmq/rabbitmq.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, TokenModule, RabbitMQModule, CacheModule.register()],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
