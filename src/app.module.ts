import { Module } from '@nestjs/common';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { CategoriesModule } from './categories/categories.module';
import { MenusModule } from './menus/menus.module';

@Module({
  imports: [RestaurantsModule, CategoriesModule, MenusModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
