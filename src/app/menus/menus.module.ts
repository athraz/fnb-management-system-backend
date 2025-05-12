import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { TokenModule } from 'src/common/token/token.module';
import { RabbitMQModule } from 'src/common/rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, TokenModule, RabbitMQModule],
  controllers: [MenusController],
  providers: [MenusService]
})
export class MenusModule {}
