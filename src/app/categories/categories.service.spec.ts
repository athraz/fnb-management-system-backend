import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { v4 as uuidv4 } from 'uuid';

jest.mock('src/common/prisma/prisma.service');
jest.mock('@nestjs/cache-manager');

describe('CategoriesService', () => {
    let service: CategoriesService;
    let prismaService: PrismaService;
    let cacheManager: Cache;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                {
                    provide: PrismaService,
                    useValue: {
                        category: {
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

        service = module.get<CategoriesService>(CategoriesService);
        prismaService = module.get<PrismaService>(PrismaService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all categories', async () => {
            const result = [
                { 
                    id: uuidv4(), 
                    name: 'category 1',
                },
            ];
            jest.spyOn(prismaService.category, 'findMany').mockResolvedValue(result);

            const categories = await service.getAll();

            expect(categories).toEqual(result);
        });
    });

    describe('getById', () => {
        it('should return a category by id', async () => {
            const id = uuidv4();
            const result = { 
                id: id, 
                name: 'category 1',
            };
            jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(result);

            const category = await service.getById(id);

            expect(category).toEqual(result);
        });

        it('should return null if category not found', async () => {
            const id = uuidv4();
            jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

            const category = await service.getById(id);

            expect(category).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new category', async () => {
            const createCategoryDto: CreateCategoryDto = { 
                name: 'category 1',
            };
            const result = { 
                id: uuidv4(), 
                name: createCategoryDto.name,
            };

            jest.spyOn(prismaService.category, 'create').mockResolvedValue(result);

            const newCategory = await service.create(createCategoryDto);

            expect(newCategory).toEqual(result);
            expect(cacheManager.del).toHaveBeenCalledWith('categories_all');
        });
    });

    describe('update', () => {
        it('should update a category successfully', async () => {
            const id = uuidv4();
            const updateCategoryDto: UpdateCategoryDto = { 
                name: 'updated category',
            };
            const result = { 
                id: id, 
                name: updateCategoryDto.name || 'category 1', 
            };

            jest.spyOn(prismaService.category, 'update').mockResolvedValue(result);

            const updatedCategory = await service.update(id, updateCategoryDto);

            expect(updatedCategory).toEqual(result);
            expect(cacheManager.del).toHaveBeenCalledWith('categories_all');
        });
    });

    describe('delete', () => {
        it('should delete a category successfully', async () => {
            const id = uuidv4();
            const result = { 
                id: id, 
                name: 'category 1',
            };

            jest.spyOn(prismaService.category, 'delete').mockResolvedValue(result);

            const deletedCategory = await service.delete(id);

            expect(deletedCategory).toEqual(result);
            expect(cacheManager.del).toHaveBeenCalledWith('categories_all');
        });

        it('should throw an error if category does not exist', async () => {
            const id = uuidv4();
            jest.spyOn(prismaService.category, 'delete').mockRejectedValue(new Error('Category not found'));

            try {
                await service.delete(id);
            } catch (error) {
                expect(error.message).toBe('Category not found');
            }
        });
    });
});
