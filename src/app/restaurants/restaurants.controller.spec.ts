import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { TokenService } from 'src/common/token/token.service';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';


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

jest.mock('./restaurants.service');

describe('RestaurantsController', () => {
    let controller: RestaurantsController;
    let service: RestaurantsService;
    let response: Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RestaurantsController],
            providers: [
                RestaurantsService,
                {provide: AuthGuard, useClass: MockAuthGuard},
                {provide: AdminGuard, useClass: MockAdminGuard},
                {provide: TokenService, useValue: {}},
            ],
        }).compile();

        controller = module.get<RestaurantsController>(RestaurantsController);
        service = module.get<RestaurantsService>(RestaurantsService);

        response = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        } as unknown as Response;
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all restaurants', async () => {
            const result = [
                {
                    id: uuidv4(),
                    name: 'restaurant 1',
                    location: 'location a',
                },
            ];
            jest.spyOn(service, 'getAll').mockResolvedValue(result);

            await controller.getAll(response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get all restaurants successful',
                data: result,
            });
        });

        it('should return 404 when no restaurants found', async () => {
            jest.spyOn(service, 'getAll').mockResolvedValue([]);

            await controller.getAll(response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Restaurant not found',
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
        it('should return restaurant by id', async () => {
            const id = uuidv4();
            const restaurant = {
                id: id,
                name: 'restaurant 1',
                location: 'location a',
            };

            jest.spyOn(service, 'getById').mockResolvedValue(restaurant);

            await controller.getById(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get restaurant by id successful',
                data: restaurant,
            });
        });

        it('should return 404 when restaurant not found', async () => {
            const id = uuidv4();

            jest.spyOn(service, 'getById').mockResolvedValue(null);

            await controller.getById(id, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Restaurant not found',
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
        it('should create a restaurant successfully', async () => {
            const createRestaurantDto: CreateRestaurantDto = {
                name: 'restaurant 1',
                location: 'location a',
            };

            const createdRestaurant = {
                id: uuidv4(),
                ...createRestaurantDto,
            };

            jest.spyOn(service, 'create').mockResolvedValue(createdRestaurant);

            await controller.create(createRestaurantDto, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Create restaurant successful',
                data: createdRestaurant,
            });
        });

        it('should return 400 when invalid data is provided', async () => {
            const invalidRestaurantDto: CreateRestaurantDto = {
                name: 'restaurant 1',
                location: '',
            };

            await controller.create(invalidRestaurantDto, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Invalid data',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const createRestaurantDto: CreateRestaurantDto = {
                name: 'restaurant 1',
                location: 'location a',
            };

            jest.spyOn(service, 'create').mockRejectedValue(new Error('Unexpected failure'));

            await controller.create(createRestaurantDto, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('update', () => {
        const id = uuidv4()
        it('should update a restaurant successfully', async () => {
            const updateRestaurantDto: UpdateRestaurantDto = {
                name: 'updated restaurant',
                location: 'updated location',
            };

            const updatedRestaurant = {
                id: id,
                name: updateRestaurantDto.name || 'restaurant 1',
                location: updateRestaurantDto.location || 'location a',
            };

            jest.spyOn(service, 'update').mockResolvedValue(updatedRestaurant);

            await controller.update(id, updateRestaurantDto, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Update restaurant successful',
                data: updatedRestaurant,
            });
        });

        it('should return 400 when invalid data is provided', async () => {
            const invalidUpdateDto: UpdateRestaurantDto = {
                location: '',
            };

            await controller.update(id, invalidUpdateDto, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Invalid data',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const updateRestaurantDto: UpdateRestaurantDto = {
                name: 'updated restaurant',
                location: 'updated location',
            };

            jest.spyOn(service, 'update').mockRejectedValue(new Error('Unexpected failure'));

            await controller.update(id, updateRestaurantDto, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('delete', () => {
        const id = uuidv4();

        it('should delete a restaurant successfully', async () => {
            const restaurant = {
                id: id,
                name: 'restaurant 1',
                location: 'location a',
            };

            jest.spyOn(service, 'delete').mockResolvedValue(restaurant);

            await controller.delete(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Delete restaurant successful',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
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
