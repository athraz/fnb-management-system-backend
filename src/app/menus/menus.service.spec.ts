import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RabbitMQService } from 'src/common/rabbitmq/rabbitmq.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateMenuDto } from './dtos/create-menu.dto';
import { UpdateMenuDto } from './dtos/update-menu.dto';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

jest.mock('src/common/prisma/prisma.service');
jest.mock('src/common/rabbitmq/rabbitmq.service');
jest.mock('@nestjs/cache-manager');

describe('MenusService', () => {
    let service: MenusService;
    let prismaService: PrismaService;
    let rabbitMQService: RabbitMQService;
    let cacheManager: Cache;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MenusService,
                {
                    provide: PrismaService,
                    useValue: {
                        menu: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                        },
                        restaurant: {
                            findUnique: jest.fn(),
                        },
                        category: {
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: RabbitMQService,
                    useValue: {
                        publishMenuUpdate: jest.fn(),
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

        service = module.get<MenusService>(MenusService);
        prismaService = module.get<PrismaService>(PrismaService);
        rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all menus with details', async () => {
            const result = [
                { 
                    id: uuidv4(), 
                    name: 'Menu 1', 
                    price: new Decimal(15000), 
                    stock: new Decimal(100),
                    imageUrl: '/uploads/menu1.jpg', 
                    restaurantId: uuidv4(),
                    categoryId: uuidv4(),
                },
            ];

            jest.spyOn(prismaService.menu, 'findMany').mockResolvedValue(result);
            jest.spyOn(prismaService.restaurant, 'findUnique').mockResolvedValue({ 
                id: uuidv4(), 
                name: 'Restaurant 1', 
                location: 'location a',
            });
            jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue({ id: uuidv4(), name: 'Category 1' });

            const menus = await service.getAll();

            expect(menus).toEqual([
                { 
                    ...result[0],
                    price: 15000,
                    stock: 100,
                    restaurant: { id: expect.any(String), name: 'Restaurant 1', location: 'location a' },
                    category: { id: expect.any(String), name: 'Category 1' },
                },
            ]);
        });
    });

    describe('getById', () => {
        it('should return a menu by id', async () => {
            const id = uuidv4();
            const result = { 
                id: id, 
                name: 'Menu 1', 
                price: new Decimal(15000), 
                stock: new Decimal(100),
                imageUrl: '/uploads/menu1.jpg', 
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };
            jest.spyOn(prismaService.menu, 'findUnique').mockResolvedValue(result);
            jest.spyOn(prismaService.restaurant, 'findUnique').mockResolvedValue({ 
                id: uuidv4(), 
                name: 'Restaurant 1', 
                location: 'location a',
            });
            jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue({ id: uuidv4(), name: 'Category 1' });

            const menu = await service.getById(id);

            expect(menu).toEqual({
                ...result,
                price: 15000,
                stock: 100,
                restaurant: { id: expect.any(String), name: 'Restaurant 1', location: 'location a'},
                category: { id: expect.any(String), name: 'Category 1' },
            });
        });

        it('should return null if menu not found', async () => {
            const id = uuidv4();
            jest.spyOn(prismaService.menu, 'findUnique').mockResolvedValue(null);

            const menu = await service.getById(id);

            expect(menu).toBeNull();
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
                name: createMenuDto.name, 
                imageUrl: createMenuDto.imageUrl,
                price: new Decimal(createMenuDto.price), 
                stock: new Decimal(createMenuDto.stock),
                restaurantId: createMenuDto.restaurantId,
                categoryId: createMenuDto.categoryId,
            };

            jest.spyOn(prismaService.menu, 'create').mockResolvedValue(result);

            const newMenu = await service.create(createMenuDto);

            expect(newMenu).toEqual(result);
            expect(rabbitMQService.publishMenuUpdate).toHaveBeenCalledWith(expect.any(String));
            expect(cacheManager.del).toHaveBeenCalledWith('menus_all');
        });
    });

    it('should update a menu successfully', async () => {
        const id = uuidv4();
        const updateMenuDto: UpdateMenuDto = { 
            name: 'Updated Menu',
            imageUrl: '/uploads/menu1.jpg', 
            price: '16000', 
            stock: '90',
            restaurantId: uuidv4(),
            categoryId: uuidv4(),
        };

        const existingMenu = {
            id,
            name: 'Old Menu',
            imageUrl: '/uploads/old.jpg',
            price: new Decimal(15000),
            stock: new Decimal(100),
            restaurantId: updateMenuDto.restaurantId,
            categoryId: updateMenuDto.categoryId,
        };

        const result = { 
            id, 
            name: updateMenuDto.name, 
            imageUrl: updateMenuDto.imageUrl, 
            price: new Decimal(updateMenuDto.price), 
            stock: new Decimal(updateMenuDto.stock),
            restaurantId: updateMenuDto.restaurantId,
            categoryId: updateMenuDto.categoryId,
        };

        jest.spyOn(prismaService.menu, 'findUnique').mockResolvedValue(existingMenu);
        jest.spyOn(prismaService.menu, 'update').mockResolvedValue(result);

        const updatedMenu = await service.update(id, updateMenuDto);

        expect(updatedMenu).toEqual(result);
        expect(rabbitMQService.publishMenuUpdate).toHaveBeenCalledWith(expect.any(String));
        expect(cacheManager.del).toHaveBeenCalledWith('menus_all');
    });

    describe('delete', () => {
        it('should delete a menu successfully', async () => {
            const id = uuidv4();
            const result = { 
                id, 
                name: 'Menu 1',
                imageUrl: '/uploads/menu1.jpg', 
                price: new Decimal(15000), 
                stock: new Decimal(100),
                restaurantId: uuidv4(),
                categoryId: uuidv4(),
            };

            jest.spyOn(prismaService.menu, 'delete').mockResolvedValue(result);

            const deletedMenu = await service.delete(id);

            expect(deletedMenu).toEqual(result);
            expect(cacheManager.del).toHaveBeenCalledWith('menus_all');
        });

        it('should throw an error if menu does not exist', async () => {
            const id = uuidv4();
            jest.spyOn(prismaService.menu, 'delete').mockRejectedValue(new Error('Menu not found'));

            try {
                await service.delete(id);
            } catch (error) {
                expect(error.message).toBe('Menu not found');
            }
        });
    });
});
