import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    async getAll() {
        return this.prisma.category.findMany()
    }
    
    async getById(id: string) {
        return this.prisma.category.findUnique({
            where: {id},
        });
    }

    async create(req: CreateCategoryDto) {
        return this.prisma.category.create({
            data: {
                name: req.name,
            },
        });
    }

    async update(id: string, req: UpdateCategoryDto) {
        return this.prisma.category.update({
            where: {id},
            data: {
                name: req.name,
            },
        });
    }

    async delete(id: string) {
        return this.prisma.category.delete({
            where: {id},
        })
    }
}
