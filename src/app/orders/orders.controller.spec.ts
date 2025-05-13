import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { BadRequestException, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { CreateOrderDto } from './dtos/create-order.dto';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { TokenService } from 'src/common/token/token.service';

class MockAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        return true;
    }
}

class MockAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        return true;
    }
}

jest.mock('./orders.service');

describe('OrdersController', () => {
    let controller: OrdersController;
    let service: OrdersService;
    let response: Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrdersController],
            providers: [
                OrdersService,
                { provide: AuthGuard, useClass: MockAuthGuard },
                { provide: AdminGuard, useClass: MockAdminGuard },
                {provide: TokenService, useValue: {}},
            ],
        }).compile();

        controller = module.get<OrdersController>(OrdersController);
        service = module.get<OrdersService>(OrdersService);
        response = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        } as unknown as Response;
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all orders', async () => {
            const result = [{
                id: uuidv4(),
                userId: uuidv4(),
                status: 'received',
                address: '123 Test St',
                menus: [
                    {
                    menuId: uuidv4(),
                    name: 'Menu 1',
                    count: 2
                    }
                ]
            }];
            jest.spyOn(service, 'getAll').mockResolvedValue(result);

            await controller.getAll(response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get all orders successful',
                data: result,
            });
        });

        it('should return 404 if no orders found', async () => {
            jest.spyOn(service, 'getAll').mockResolvedValue([]);

            await controller.getAll(response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Order not found',
                data: null,
            });
        });
    });

    describe('getById', () => {
        it('should return order by id', async () => {
            const id = uuidv4();
            const order = {
                id: uuidv4(),
                userId: uuidv4(),
                status: 'received',
                address: '123 Test St',
                menus: [
                    {
                    menuId: uuidv4(),
                    name: 'Menu 1',
                    count: 2
                    }
                ]
            };
            jest.spyOn(service, 'getById').mockResolvedValue(order);

            await controller.getById(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get order by id successful',
                data: order,
            });
        });

        it('should return 404 if order not found', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'getById').mockRejectedValue(new NotFoundException('Order not found'));

            await controller.getById(id, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Order not found',
                data: null,
            });
        });
    });

    describe('create', () => {
        it('should create an order successfully', async () => {
            const user = { userId: uuidv4() };
            const request = { user };
            const createOrderDto: CreateOrderDto = { 
                address: 'some address'
            } as any;

            const result = { 
                id: uuidv4(),
                address: createOrderDto.address,
                orderMenus: [
                    { 
                        count: new Decimal(2), 
                        menuId: uuidv4(), 
                        orderId: uuidv4() 
                    }
                ],
                status: 'received',
                userId: user.userId,
            };

            jest.spyOn(service, 'create').mockResolvedValue(result);

            await controller.create(createOrderDto, request, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Create order successful',
                data: result,
            });
        });

        it('should return 400 if user id is missing', async () => {
            const createOrderDto: CreateOrderDto = { 
                address: 'some address'
            } as any;
            const request = {};

            await controller.create(createOrderDto, request, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Failed to get user id',
                data: null,
            });
        });
    });

    describe('prepare', () => {
        it('should change the order status to prepare successfully', async () => {
            const id = uuidv4();
            const order = {
                id,
                userId: uuidv4(),
                status: 'received',
                address: 'some address',
                menus: [
                    {
                        menuId: uuidv4(),
                        name: 'Menu 1',
                        count: 2
                    }
                ]
            };
            jest.spyOn(service, 'prepare').mockResolvedValue(order);

            await controller.prepare(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Change order status to prepare successful',
                data: order,
            });
        });

        it('should return 400 if bad request error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'prepare').mockRejectedValue(new BadRequestException('Bad request'));

            await controller.prepare(id, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Bad request',
                data: null,
            });
        });

        it('should return 500 if internal server error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'prepare').mockRejectedValue(new Error('Internal server error'));

            await controller.prepare(id, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('ready', () => {
        it('should change the order status to ready successfully', async () => {
            const id = uuidv4();
            const order = {
                id,
                userId: uuidv4(),
                status: 'preparing',
                address: 'some address',
                menus: [
                    {
                        menuId: uuidv4(),
                        name: 'Menu 1',
                        count: 2
                    }
                ]
            };
            jest.spyOn(service, 'ready').mockResolvedValue(order);

            await controller.ready(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Change order status to ready successful',
                data: order,
            });
        });

        it('should return 400 if bad request error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'ready').mockRejectedValue(new BadRequestException('Bad request'));

            await controller.ready(id, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Bad request',
                data: null,
            });
        });

        it('should return 500 if internal server error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'ready').mockRejectedValue(new Error('Internal server error'));

            await controller.ready(id, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('pickup', () => {
        it('should change the order status to pickup successfully', async () => {
            const id = uuidv4();
            const order = {
                id,
                userId: uuidv4(),
                status: 'ready',
                address: 'some address',
                menus: [
                    {
                        menuId: uuidv4(),
                        name: 'Menu 1',
                        count: 2
                    }
                ]
            };
            jest.spyOn(service, 'pickup').mockResolvedValue(order);

            await controller.pickup(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Change order status to picked up successful',
                data: order,
            });
        });

        it('should return 400 if bad request error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'pickup').mockRejectedValue(new BadRequestException('Bad request'));

            await controller.pickup(id, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Bad request',
                data: null,
            });
        });

        it('should return 500 if internal server error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'pickup').mockRejectedValue(new Error('Internal server error'));

            await controller.pickup(id, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('deliver', () => {
        it('should change the order status to deliver successfully', async () => {
            const id = uuidv4();
            const order = {
                id,
                userId: uuidv4(),
                status: 'picked up',
                address: 'some address',
                menus: [
                    {
                        menuId: uuidv4(),
                        name: 'Menu 1',
                        count: 2
                    }
                ]
            };
            jest.spyOn(service, 'deliver').mockResolvedValue(order);

            await controller.deliver(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Change order status to delivered successful',
                data: order,
            });
        });

        it('should return 400 if bad request error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'deliver').mockRejectedValue(new BadRequestException('Bad request'));

            await controller.deliver(id, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Bad request',
                data: null,
            });
        });

        it('should return 500 if internal server error occurs', async () => {
            const id = uuidv4();
            jest.spyOn(service, 'deliver').mockRejectedValue(new Error('Internal server error'));

            await controller.deliver(id, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });
});