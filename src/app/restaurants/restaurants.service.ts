import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RestaurantsService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async getAll() {
        return this.prisma.restaurant.findMany()
    }
    
    async getById(id: string) {
        return this.prisma.restaurant.findUnique({
            where: {id},
        });
    }

    async create(req: CreateRestaurantDto) {
        const newRestaurant = this.prisma.restaurant.create({
            data: {
                name: req.name,
                location: req.location,
            },
        });
        await this.cacheManager.del('restaurants_all');
        return newRestaurant;
    }

    async update(id: string, req: UpdateRestaurantDto) {
        const updatedRestaurant = this.prisma.restaurant.update({
            where: {id},
            data: {
                name: req.name,
                location: req.location,
            },
        });
        await this.cacheManager.del('restaurants_all');
        return updatedRestaurant;
    }

    async delete(id: string) {
        await this.cacheManager.del('restaurants_all');
        return this.prisma.restaurant.delete({
            where: {id},
        })
    }
}
