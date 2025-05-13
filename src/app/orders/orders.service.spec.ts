import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RabbitMQService } from 'src/common/rabbitmq/rabbitmq.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateOrderDto } from './dtos/create-order.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

jest.mock('src/common/prisma/prisma.service');
jest.mock('src/common/rabbitmq/rabbitmq.service');
jest.mock('@nestjs/cache-manager');

describe('OrdersService', () => {
    let service: OrdersService;
    let prismaService: PrismaService;
    let rabbitmqService: RabbitMQService;
    let cacheManager: Cache;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                {
                    provide: PrismaService,
                    useValue: {
                        order: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        orderMenu: {
                            findMany: jest.fn(),
                        },
                        menu: {
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
                {
                    provide: RabbitMQService,
                    useValue: {
                        publishOrderUpdate: jest.fn(),
                    },
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: {
                        del: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        prismaService = module.get<PrismaService>(PrismaService);
        rabbitmqService = module.get<RabbitMQService>(RabbitMQService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all orders', async () => {
            const orderId = uuidv4();
            const userId = uuidv4();
            const menuId = uuidv4();

            const result = [
                { 
                    id: orderId, 
                    status: 'received', 
                    address: 'address 1',
                    userId: userId, 
                },
            ];

            const orderMenus = [
                {
                    menuId: menuId,
                    count: new Decimal(2),
                    orderId: orderId,
                },
            ];

            const menu = {
                id: uuidv4(),
                name: 'Menu 1', 
                imageUrl: '/uploads/menu1.jpg', 
                price: new Decimal(15000), 
                stock: new Decimal(100),
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            jest.spyOn(prismaService.order, 'findMany').mockResolvedValue(result);
            jest.spyOn(prismaService.orderMenu, 'findMany').mockResolvedValue(orderMenus);
            jest.spyOn(prismaService.menu, 'findUnique').mockResolvedValue(menu);

            const orders = await service.getAll();

            expect(orders).toEqual([
                {
                    ...result[0],
                    menus: [
                        {
                            menuId,
                            name: 'Menu 1',
                            count: 2,
                        },
                    ],
                },
            ]);
        });
    });

    describe('getById', () => {
        it('should return an order by id', async () => {
            const orderId = uuidv4();
            const menuId = uuidv4();

            const result = { 
                id: orderId, 
                status: 'received', 
                address: 'address 1',
                userId: uuidv4(),
            };

            const orderMenus = [
                {
                    menuId: menuId,
                    count: new Decimal(2),
                    orderId: orderId,
                },
            ];

            const menu = {
                id: uuidv4(),
                name: 'Menu 1', 
                imageUrl: '/uploads/menu1.jpg', 
                price: new Decimal(15000), 
                stock: new Decimal(100),
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(result);
            jest.spyOn(prismaService.orderMenu, 'findMany').mockResolvedValue(orderMenus);
            jest.spyOn(prismaService.menu, 'findUnique').mockResolvedValue(menu);

            const order = await service.getById(orderId);

            expect(order).toEqual({
                ...result,
                menus: [
                    {
                        menuId,
                        name: 'Menu 1',
                        count: 2,
                    },
                ],
            });
        });
    });

    describe('create', () => {
        it('should create a new order', async () => {
            const createOrderDto: CreateOrderDto = {
                address: 'address 1',
                menus: [{ menuId: uuidv4(), count: '2' }],
            };

            const result = { 
                id: uuidv4(),
                status: 'received',
                address: createOrderDto.address,
                menus: createOrderDto.menus,
                userId: uuidv4()
            };

            const menu = { 
                id: createOrderDto.menus[0].menuId, 
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: new Decimal(10000),
                stock: new Decimal(10),
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            jest.spyOn(prismaService.menu, 'findMany').mockResolvedValue([menu]);
            jest.spyOn(prismaService.order, 'create').mockResolvedValue(result);

            (prismaService as any).$transaction = jest.fn().mockImplementation(async (callback) => {
                return callback(prismaService);
            });

            const newOrder = await service.create('userId', createOrderDto);

            expect(newOrder).toEqual(result);
            expect(rabbitmqService.publishOrderUpdate).toHaveBeenCalledWith(
                JSON.stringify({ action: 'order_received', order: result }),
            );
            expect(cacheManager.del).toHaveBeenCalledWith('orders_all');
        });

        it('should throw BadRequestException if stock is insufficient', async () => {
            const createOrderDto: CreateOrderDto = {
                address: 'address 1',
                menus: [{ menuId: uuidv4(), count: '20' }],
            };
            const menu = { 
                id: createOrderDto.menus[0].menuId, 
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: new Decimal(10000),
                stock: new Decimal(10),
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };
            jest.spyOn(prismaService.menu, 'findMany').mockResolvedValue([menu]);

            await expect(service.create('userId', createOrderDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('prepare', () => {
        it('should update order status to "preparing"', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'received',
                address: 'address 1',
                userId: uuidv4(),
            };
            const updatedOrder = { ...order, status: 'preparing' };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);
            jest.spyOn(prismaService.order, 'update').mockResolvedValue(updatedOrder);

            const result = await service.prepare(id);

            expect(result.status).toBe('preparing');
            expect(rabbitmqService.publishOrderUpdate).toHaveBeenCalledWith(
                JSON.stringify({ action: 'order_preparing', order: updatedOrder }),
            );
            expect(cacheManager.del).toHaveBeenCalledWith('orders_all');
        });

        it('should throw BadRequestException if order is not in "received" status', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'preparing',
                address: 'address 1',
                userId: uuidv4(),
            };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);

            await expect(service.prepare(id)).rejects.toThrow(BadRequestException);
        });
    });

    describe('ready', () => {
        it('should update order status to "ready"', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'preparing',
                address: 'address 1',
                userId: uuidv4(),
            };
            const updatedOrder = { ...order, status: 'ready' };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);
            jest.spyOn(prismaService.order, 'update').mockResolvedValue(updatedOrder);

            const result = await service.ready(id);

            expect(result.status).toBe('ready');
            expect(rabbitmqService.publishOrderUpdate).toHaveBeenCalledWith(
                JSON.stringify({ action: 'order_ready', order: updatedOrder }),
            );
            expect(cacheManager.del).toHaveBeenCalledWith('orders_all');
        });

        it('should throw BadRequestException if order is not in "preparing" status', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'received',
                address: 'address 1',
                userId: uuidv4(),
            };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);

            await expect(service.ready(id)).rejects.toThrow(BadRequestException);
        });
    });

    describe('pickup', () => {
        it('should update order status to "picked up"', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'ready',
                address: 'address 1',
                userId: uuidv4(),
            };
            const updatedOrder = { ...order, status: 'picked up' };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);
            jest.spyOn(prismaService.order, 'update').mockResolvedValue(updatedOrder);

            const result = await service.pickup(id);

            expect(result.status).toBe('picked up');
            expect(rabbitmqService.publishOrderUpdate).toHaveBeenCalledWith(
                JSON.stringify({ action: 'order_picked_up', order: updatedOrder }),
            );
            expect(cacheManager.del).toHaveBeenCalledWith('orders_all');
        });

        it('should throw BadRequestException if order is not in "ready" status', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'received',
                address: 'address 1',
                userId: uuidv4(),
            };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);

            await expect(service.pickup(id)).rejects.toThrow(BadRequestException);
        });
    });

    describe('deliver', () => {
        it('should update order status to "delivered"', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'picked up',
                address: 'address 1',
                userId: uuidv4(),
            };
            const updatedOrder = { ...order, status: 'delivered' };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);
            jest.spyOn(prismaService.order, 'update').mockResolvedValue(updatedOrder);

            const result = await service.deliver(id);

            expect(result.status).toBe('delivered');
            expect(rabbitmqService.publishOrderUpdate).toHaveBeenCalledWith(
                JSON.stringify({ action: 'order_delivered', order: updatedOrder }),
            );
            expect(cacheManager.del).toHaveBeenCalledWith('orders_all');
        });

        it('should throw BadRequestException if order is not in "picked up" status', async () => {
            const id = uuidv4();
            const order = { 
                id, 
                status: 'received',
                address: 'address 1',
                userId: uuidv4(),
            };
            jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(order);

            await expect(service.deliver(id)).rejects.toThrow(BadRequestException);
        });
    });
});
