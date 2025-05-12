import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateMenuDto } from './dtos/create-menu.dto';
import { UpdateMenuDto } from './dtos/update-menu.dto';
import { RabbitMQService } from 'src/common/rabbitmq/rabbitmq.service';

@Injectable()
export class MenusService {
    constructor(
        private prisma: PrismaService,
        private rabbitmq: RabbitMQService
    ) {}

    async getAll() {
        const menus = await this.prisma.menu.findMany();
        
        return menus.map(menu => ({
            ...menu,
            price: parseFloat(menu.price.toString()),
            stock: parseInt(menu.stock.toString(), 10)
        }));
    }
    
    async getById(id: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { id },
        });

        if (menu) {
            return {
                ...menu,
                price: parseFloat(menu.price.toString()),
                stock: parseInt(menu.stock.toString(), 10)
            };
        }

        return null;
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

        return updatedMenu;
    }

    async delete(id: string) {
        return this.prisma.menu.delete({
            where: {id},
        })
    }
}
