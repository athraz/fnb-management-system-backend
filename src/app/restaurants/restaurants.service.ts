import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
    constructor(private prisma: PrismaService) {}

    async getAll() {
        return this.prisma.restaurant.findMany()
    }
    
    async getById(id: string) {
        return this.prisma.restaurant.findUnique({
            where: {id},
        });
    }

    async create(req: CreateRestaurantDto) {
        return this.prisma.restaurant.create({
            data: {
                name: req.name,
                location: req.location,
            },
        });
    }

    async update(id: string, req: UpdateRestaurantDto) {
        return this.prisma.restaurant.update({
            where: {id},
            data: {
                name: req.name,
                location: req.location,
            },
        });
    }

    async delete(id: string) {
        return this.prisma.restaurant.delete({
            where: {id},
        })
    }
}
