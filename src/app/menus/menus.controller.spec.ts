import { Test, TestingModule } from '@nestjs/testing';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { CreateMenuDto } from './dtos/create-menu.dto';
import { UpdateMenuDto } from './dtos/update-menu.dto';
import { TokenService } from 'src/common/token/token.service';
import Decimal from 'decimal.js';


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

jest.mock('./menus.service');

describe('MenusController', () => {
    let controller: MenusController;
    let service: MenusService;
    let response: Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MenusController],
            providers: [
                MenusService,
                {provide: AuthGuard, useClass: MockAuthGuard},
                {provide: AdminGuard, useClass: MockAdminGuard},
                {provide: TokenService, useValue: {}},
            ],
        }).compile();

        controller = module.get<MenusController>(MenusController);
        service = module.get<MenusService>(MenusService);

        response = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        } as unknown as Response;
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all menus', async () => {
            const result = [
                {
                    id: uuidv4(),
                    name: 'Menu 1',
                    price: 15000,
                    stock: 100,
                    restaurant: {
                        name: 'Restaurant A',
                        id: uuidv4(),
                        location: 'Location A',
                    },
                    category: {
                        name: 'Category A',
                        id: uuidv4(),
                    },
                    imageUrl: '/uploads/menu1.jpg',
                    restaurantId: uuidv4(),
                    categoryId: uuidv4(),
                },
            ];
            jest.spyOn(service, 'getAll').mockResolvedValue(result);

            await controller.getAll(response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get all menus successful',
                data: result,
            });
        });

        it('should return 404 when no menus found', async () => {
            jest.spyOn(service, 'getAll').mockResolvedValue([]);

            await controller.getAll(response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Menu not found',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            jest.spyOn(service, 'getAll').mockRejectedValue(new Error('Unexpected failure'));

            await controller.getAll(response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('getById', () => {
        it('should return menu by id', async () => {
            const id = uuidv4();
            const menu = {
                id: uuidv4(),
                name: 'Menu 1',
                price: 15000,
                stock: 100,
                restaurant: {
                    name: 'Restaurant A',
                    id: uuidv4(),
                    location: 'Location A',
                },
                category: {
                    name: 'Category A',
                    id: uuidv4(),
                },
                imageUrl: '/uploads/menu1.jpg',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            jest.spyOn(service, 'getById').mockResolvedValue(menu);

            await controller.getById(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get menu by id successful',
                data: menu,
            });
        });

        it('should return 404 when menu not found', async () => {
            const id = uuidv4();

            jest.spyOn(service, 'getById').mockResolvedValue(null);

            await controller.getById(id, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Menu not found',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const id = uuidv4();

            jest.spyOn(service, 'getById').mockRejectedValue(new Error('Unexpected failure'));

            await controller.getById(id, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('create', () => {
        it('should create a new menu', async () => {
            const createMenuDto: CreateMenuDto = {
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: '15000',
                stock: '100',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            const result = { 
                id: uuidv4(), 
                ...createMenuDto, 
                price: new Decimal(createMenuDto.price),
                stock: new Decimal(createMenuDto.stock)
            };

            jest.spyOn(service, 'create').mockResolvedValue(result);

            await controller.create(createMenuDto, response, {} as any);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Create menu successful',
                data: result,
            });
        });

        it('should return 400 when invalid data is provided', async () => {
            const createMenuDto: CreateMenuDto = { 
                name: '',
                imageUrl: '/uploads/menu1.jpg',
                price: '15000',
                stock: '100',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            await controller.create(createMenuDto, response, {} as any);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Invalid data',
                data: null,
            });
        });

        it('should return 400 when no image file is uploaded', async () => {
            const createMenuDto: CreateMenuDto = {
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: '15000',
                stock: '100',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            await controller.create(createMenuDto, response as Response, undefined);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Image file is required',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const createMenuDto: CreateMenuDto = {
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: '15000',
                stock: '100',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            jest.spyOn(service, 'create').mockRejectedValue(new Error('Unexpected failure'));

            await controller.create(createMenuDto, response, {} as any); // Mock file

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('update', () => {
        it('should update the menu', async () => {
            const id = uuidv4();
            const updateMenuDto: UpdateMenuDto = { 
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: '15000',
                stock: '100',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };
            const result = { 
                id: uuidv4(), 
                ...updateMenuDto, 
                price: new Decimal(updateMenuDto.price),
                stock: new Decimal(updateMenuDto.stock)
            };

            jest.spyOn(service, 'update').mockResolvedValue(result);

            await controller.update(id, updateMenuDto, response, {} as any); // Mock file

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Update menu successful',
                data: result,
            });
        });

        it('should return 400 when invalid data is provided', async () => {
            const updateMenuDto: UpdateMenuDto = {
                name: '',
                imageUrl: '/uploads/menu1.jpg',
                price: '15000',
                stock: '100',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            await controller.update(uuidv4(), updateMenuDto, response, undefined);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Invalid data',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const updateMenuDto: UpdateMenuDto = {
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: '15000',
                stock: '100',
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            jest.spyOn(service, 'update').mockRejectedValue(new Error('Unexpected failure'));

            await controller.update(uuidv4(), updateMenuDto, response, {} as any);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('delete', () => {
        it('should delete the menu', async () => {
            const id = uuidv4();
            const deletedMenu = {
                id,
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg',
                price: new Decimal('15000'),
                stock: new Decimal('100'),
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };


            jest.spyOn(service, 'delete').mockResolvedValue(deletedMenu);

            await controller.delete(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Delete menu successful',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const id = uuidv4();

            jest.spyOn(service, 'delete').mockRejectedValue(new Error('Unexpected failure'));

            await controller.delete(id, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });
});
