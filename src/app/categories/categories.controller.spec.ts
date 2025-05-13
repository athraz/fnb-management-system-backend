import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { TokenService } from 'src/common/token/token.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';


class MockAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        return true;
    }
}

jest.mock('./categories.service');

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let service: CategoriesService;
    let response: Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                CategoriesService,
                {provide: AuthGuard, useClass: MockAuthGuard},
                {provide: TokenService, useValue: {}},
            ],
        }).compile();

        controller = module.get<CategoriesController>(CategoriesController);
        service = module.get<CategoriesService>(CategoriesService);

        response = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        } as unknown as Response;
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all categories', async () => {
            const result = [
                {
                    id: uuidv4(),
                    name: 'category 1',
                },
            ];
            jest.spyOn(service, 'getAll').mockResolvedValue(result);

            await controller.getAll(response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get all categories successful',
                data: result,
            });
        });

        it('should return 404 when no categories found', async () => {
            jest.spyOn(service, 'getAll').mockResolvedValue([]);

            await controller.getAll(response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Category not found',
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
        it('should return category by id', async () => {
            const id = uuidv4();
            const category = {
                id: id,
                name: 'category 1',
            };

            jest.spyOn(service, 'getById').mockResolvedValue(category);

            await controller.getById(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Get category by id successful',
                data: category,
            });
        });

        it('should return 404 when category not found', async () => {
            const id = uuidv4();

            jest.spyOn(service, 'getById').mockResolvedValue(null);

            await controller.getById(id, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Category not found',
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
        it('should create a category successfully', async () => {
            const createCategoryDto: CreateCategoryDto = {
                name: 'category 1',
            };

            const createdCategory = {
                id: uuidv4(),
                ...createCategoryDto,
            };

            jest.spyOn(service, 'create').mockResolvedValue(createdCategory);

            await controller.create(createCategoryDto, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Create category successful',
                data: createdCategory,
            });
        });

        it('should return 400 when invalid data is provided', async () => {
            const invalidCategoryDto: CreateCategoryDto = {
                name: '',
            };

            await controller.create(invalidCategoryDto, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Invalid data',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const createCategoryDto: CreateCategoryDto = {
                name: 'category 1',
            };

            jest.spyOn(service, 'create').mockRejectedValue(new Error('Unexpected failure'));

            await controller.create(createCategoryDto, response);

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
        it('should update a category successfully', async () => {
            const updateCategoryDto: UpdateCategoryDto = {
                name: 'updated category',
            };

            const updatedCategory = {
                id: id,
                name: updateCategoryDto.name || 'category 1',
            };

            jest.spyOn(service, 'update').mockResolvedValue(updatedCategory);

            await controller.update(id, updateCategoryDto, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Update category successful',
                data: updatedCategory,
            });
        });

        it('should return 400 when invalid data is provided', async () => {
            const invalidUpdateDto: UpdateCategoryDto = {
                name: '',
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
            const updateCategoryDto: UpdateCategoryDto = {
                name: 'updated category',
            };

            jest.spyOn(service, 'update').mockRejectedValue(new Error('Unexpected failure'));

            await controller.update(id, updateCategoryDto, response);

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

        it('should delete a category successfully', async () => {
            const category = {
                id: id,
                name: 'category 1',
            };

            jest.spyOn(service, 'delete').mockResolvedValue(category);

            await controller.delete(id, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Delete category successful',
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
