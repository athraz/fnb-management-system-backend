import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TokenModule } from 'src/common/token/token.module';

@Module({
  imports: [PrismaModule, TokenModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService]
})
export class RestaurantsModule {}
