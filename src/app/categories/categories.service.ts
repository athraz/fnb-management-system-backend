import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CategoriesService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async getAll() {
        return this.prisma.category.findMany()
    }
    
    async getById(id: string) {
        return this.prisma.category.findUnique({
            where: {id},
        });
    }

    async create(req: CreateCategoryDto) {
        const newCategory = this.prisma.category.create({
            data: {
                name: req.name,
            },
        });
        await this.cacheManager.del('category_all');
        return newCategory;
    }

    async update(id: string, req: UpdateCategoryDto) {
        const updatedCategory = this.prisma.category.update({
            where: {id},
            data: {
                name: req.name,
            },
        });
        await this.cacheManager.del('category_all');
        return updatedCategory;
    }

    async delete(id: string) {
        await this.cacheManager.del('category_all');
        return this.prisma.category.delete({
            where: {id},
        })
    }
}
