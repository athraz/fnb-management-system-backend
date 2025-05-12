import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateMenuDto } from './dtos/create-menu.dto';
import { UpdateMenuDto } from './dtos/update-menu.dto';
import { RabbitMQService } from 'src/common/rabbitmq/rabbitmq.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class MenusService {
    constructor(
        private prisma: PrismaService,
        private rabbitmq: RabbitMQService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async getAll() {
        const menus = await this.prisma.menu.findMany();

        const detailedMenus = await Promise.all(
            menus.map(async (menu) => {
                const restaurant = await this.prisma.restaurant.findUnique({
                    where: { id: menu.restaurantId },
                });

                const category = await this.prisma.category.findUnique({
                    where: { id: menu.categoryId },
                });

                return {
                    ...menu,
                    price: parseFloat(menu.price.toString()),
                    stock: parseInt(menu.stock.toString(), 10),
                    restaurant,
                    category,
                };
            })
        );

        return detailedMenus;
    }
    
    async getById(id: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { id },
        });

        if (!menu) {
            return null;
        }

        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: menu.restaurantId },
        });

        const category = await this.prisma.category.findUnique({
            where: { id: menu.categoryId },
        });

        return {
            ...menu,
            price: parseFloat(menu.price.toString()),
            stock: parseInt(menu.stock.toString(), 10),
            restaurant,
            category,
        };
    }

    async create(req: CreateMenuDto) {
        const newMenu = await this.prisma.menu.create({
            data: {
                name: req.name,
                imageUrl: req.imageUrl,
                price: parseFloat(req.price.toString()),
                stock: parseInt(req.stock.toString(), 10),
                restaurantId: req.restaurantId,
                categoryId: req.categoryId,
            },
        });

        await this.rabbitmq.publishMenuUpdate(
            JSON.stringify({
                action: 'menu_created',
                menu: newMenu,
            }),
        );
        
        await this.cacheManager.del('menus_all');
        return newMenu;
    }

    async update(id: string, req: UpdateMenuDto) {
        const existingMenu = await this.prisma.menu.findUnique({ 
            where: {id}
        });
        if (!existingMenu) {
            throw new NotFoundException('Menu not found');
        }

        const updatedMenu = await this.prisma.menu.update({
            where: {id},
            data: {
                ...req,
            },
        });

        await this.rabbitmq.publishMenuUpdate(
            JSON.stringify({
                action: updatedMenu.stock.toNumber() === 0 ? 'menu_out_of_stock' : 'menu_updated',
                menu: updatedMenu,
            }),
        );

        await this.cacheManager.del('menus_all');
        return updatedMenu;
    }

    async delete(id: string) {
        await this.cacheManager.del('menus_all');
        return this.prisma.menu.delete({
            where: {id},
        })
    }
}
