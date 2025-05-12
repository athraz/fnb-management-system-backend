import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { TokenModule } from 'src/common/token/token.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, TokenModule, CacheModule.register()],
  controllers: [CategoriesController],
  providers: [CategoriesService]
})
export class CategoriesModule {}
