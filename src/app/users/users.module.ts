import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TokenModule } from 'src/common/token/token.module';

@Module({
  imports: [PrismaModule, TokenModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
