import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { RabbitMQService } from 'src/common/rabbitmq/rabbitmq.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private rabbitmq: RabbitMQService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async getAll() {
        const orders = await this.prisma.order.findMany();

        const detailedOrders = await Promise.all(
            orders.map(async (order) => {
                const orderMenus = await this.prisma.orderMenu.findMany({
                    where: { orderId: order.id },
                    select: {
                        menuId: true,
                        count: true,
                    },
                });

                const detailedMenus = await Promise.all(
                    orderMenus.map(async (om) => {
                        const menu = await this.prisma.menu.findUnique({
                            where: { id: om.menuId },
                            select: { name: true },
                        });

                        return {
                            menuId: om.menuId,
                            name: menu?.name || 'Unknown',
                            count: om.count.toNumber(),
                        };
                    })
                );

                return {
                    ...order,
                    menus: detailedMenus,
                };
            })
        );

        return detailedOrders;
    }

    async getById(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const orderMenus = await this.prisma.orderMenu.findMany({
            where: { orderId: order.id },
            select: {
                menuId: true,
                count: true,
            },
        });

        const detailedMenus = await Promise.all(
            orderMenus.map(async (om) => {
                const menu = await this.prisma.menu.findUnique({
                    where: { id: om.menuId },
                    select: { name: true },
                });

                return {
                    menuId: om.menuId,
                    name: menu?.name || 'Unknown',
                    count: om.count.toNumber(),
                };
            })
        );

        return {
            ...order,
            menus: detailedMenus,
        };
    }

    async create(userId: string, req: CreateOrderDto) {
        const menuIds = req.menus.map(menu => menu.menuId);

        const menus = await this.prisma.menu.findMany({
            where: {
                id: { in: menuIds },
            },
            select: {
                id: true,
                restaurantId: true,
                stock: true,
            },
        });

        if (menus.length !== menuIds.length) {
            throw new BadRequestException('One or more menus not found');
        }

        const uniqueRestaurantIds = new Set(menus.map(menu => menu.restaurantId));
        if (uniqueRestaurantIds.size > 1) {
            throw new BadRequestException('All menus must be from the same restaurant');
        }

        for (const requested of req.menus) {
            const menu = menus.find(m => m.id === requested.menuId);
            const requestedCount = parseInt(requested.count.toString(), 10);

            if (!menu) {
                throw new BadRequestException(`Menu ${requested.menuId} not found`);
            }

            if (menu.stock.toNumber() < requestedCount) {
                throw new BadRequestException(`Insufficient stock for menu ${requested.menuId}`);
            }
        }

        const newOrder = await this.prisma.$transaction(async (tx) => {
            for (const requested of req.menus) {
                const requestedCount = parseInt(requested.count.toString(), 10);
                await tx.menu.update({
                    where: { id: requested.menuId },
                    data: {
                        stock: {
                            decrement: requestedCount,
                        },
                    },
                });
            }

            return tx.order.create({
                data: {
                    userId: userId,
                    address: req.address,
                    status: "received",
                    orderMenus: {
                        create: req.menus.map(menu => ({
                            menuId: menu.menuId,
                            count: parseInt(menu.count.toString(), 10),
                        })),
                    },
                },
                include: {
                    orderMenus: true,
                },
            });
        });

        await this.rabbitmq.publishOrderUpdate(
            JSON.stringify({
                action: 'order_received',
                order: newOrder,
            }),
        );

        await this.cacheManager.del('orders_all');
        return newOrder;
    }

    async prepare(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            select: { id: true, status: true },
        });

        if (!order || order.status !== 'received') {
            throw new BadRequestException('Order cannot be prepared. It must be in "received" status.');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: 'preparing',
            },
        });

        await this.rabbitmq.publishOrderUpdate(
            JSON.stringify({
                action: 'order_preparing',
                order: updatedOrder,
            }),
        );

        await this.cacheManager.del('orders_all');
        return updatedOrder;
    }

    async ready(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            select: { id: true, status: true },
        });

        if (!order || order.status !== 'preparing') {
            throw new BadRequestException('Order cannot be ready. It must be in "preparing" status.');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: 'ready',
            },
        });

        await this.rabbitmq.publishOrderUpdate(
            JSON.stringify({
                action: 'order_ready',
                order: updatedOrder,
            }),
        );

        await this.cacheManager.del('orders_all');
        return updatedOrder;
    }

    async pickup(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            select: { id: true, status: true },
        });

        if (!order || order.status !== 'ready') {
            throw new BadRequestException('Order cannot be picked up. It must be in "ready" status.');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: 'picked up',
            },
        });

        await this.rabbitmq.publishOrderUpdate(
            JSON.stringify({
                action: 'order_picked_up',
                order: updatedOrder,
            }),
        );

        await this.cacheManager.del('orders_all');
        return updatedOrder;
    }

    async deliver(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            select: { id: true, status: true },
        });

        if (!order || order.status !== 'picked up') {
            throw new BadRequestException('Order cannot be delivered. It must be in "picked up" status.');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: 'delivered',
            },
        });

        await this.rabbitmq.publishOrderUpdate(
            JSON.stringify({
                action: 'order_delivered',
                order: updatedOrder,
            }),
        );

        await this.cacheManager.del('orders_all');
        return updatedOrder;
    }
}