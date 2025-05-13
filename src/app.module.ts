import { Module } from '@nestjs/common';
import { CategoriesModule } from './app/categories/categories.module';
import { MenusModule } from './app/menus/menus.module';
import { UsersModule } from './app/users/users.module';
import { RestaurantsModule } from './app/restaurants/restaurants.module';
import { OrdersModule } from './app/orders/orders.module';

@Module({
  imports: [RestaurantsModule, CategoriesModule, MenusModule, UsersModule, OrdersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
