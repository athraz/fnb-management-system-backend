import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { v4 as uuidv4 } from 'uuid';

jest.mock('src/common/prisma/prisma.service');
jest.mock('@nestjs/cache-manager');

describe('RestaurantsService', () => {
    let service: RestaurantsService;
    let prismaService: PrismaService;
    let cacheManager: Cache;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RestaurantsService,
                {
                    provide: PrismaService,
                    useValue: {
                        restaurant: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                        },
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

        service = module.get<RestaurantsService>(RestaurantsService);
        prismaService = module.get<PrismaService>(PrismaService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all restaurants', async () => {
            const result = [
                { 
                    id: uuidv4(), 
                    name: 'restaurant 1', 
                    location: 'location a' 
                },
            ];
            jest.spyOn(prismaService.restaurant, 'findMany').mockResolvedValue(result);

            const restaurants = await service.getAll();

            expect(restaurants).toEqual(result);
        });
    });

    describe('getById', () => {
        it('should return a restaurant by id', async () => {
            const id = uuidv4();
            const result = { 
                id: id, 
                name: 'restaurant 1', 
                location: 'location a' 
            };
            jest.spyOn(prismaService.restaurant, 'findUnique').mockResolvedValue(result);

            const restaurant = await service.getById(id);

            expect(restaurant).toEqual(result);
        });

        it('should return null if restaurant not found', async () => {
            const id = uuidv4();
            jest.spyOn(prismaService.restaurant, 'findUnique').mockResolvedValue(null);

            const restaurant = await service.getById(id);

            expect(restaurant).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new restaurant', async () => {
            const createRestaurantDto: CreateRestaurantDto = { 
                name: 'restaurant 1', 
                location: 'location a',
            };
            const result = { 
                id: uuidv4(), 
                name: createRestaurantDto.name, 
                location: createRestaurantDto.location,
            };

            jest.spyOn(prismaService.restaurant, 'create').mockResolvedValue(result);

            const newRestaurant = await service.create(createRestaurantDto);

            expect(newRestaurant).toEqual(result);
            expect(cacheManager.del).toHaveBeenCalledWith('restaurants_all');
        });
    });

    describe('update', () => {
        it('should update a restaurant successfully', async () => {
            const id = uuidv4();
            const updateRestaurantDto: UpdateRestaurantDto = { 
                name: 'updated restaurant', 
                location: 'updated location' 
            };
            const result = { 
                id: id, 
                name: updateRestaurantDto.name || 'restaurant 1', 
                location: updateRestaurantDto.location || 'location a',
            };

            jest.spyOn(prismaService.restaurant, 'update').mockResolvedValue(result);

            const updatedRestaurant = await service.update(id, updateRestaurantDto);

            expect(updatedRestaurant).toEqual(result);
            expect(cacheManager.del).toHaveBeenCalledWith('restaurants_all');
        });
    });

    describe('delete', () => {
        it('should delete a restaurant successfully', async () => {
            const id = uuidv4();
            const result = { 
                id: id, 
                name: 'restaurant 1', 
                location: 'location a',
            };

            jest.spyOn(prismaService.restaurant, 'delete').mockResolvedValue(result);

            const deletedRestaurant = await service.delete(id);

            expect(deletedRestaurant).toEqual(result);
            expect(cacheManager.del).toHaveBeenCalledWith('restaurants_all');
        });

        it('should throw an error if restaurant does not exist', async () => {
            const id = uuidv4();
            jest.spyOn(prismaService.restaurant, 'delete').mockRejectedValue(new Error('Restaurant not found'));

            try {
                await service.delete(id);
            } catch (error) {
                expect(error.message).toBe('Restaurant not found');
            }
        });
    });
});
