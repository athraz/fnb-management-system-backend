import { Controller, Get, Post, Patch, Delete, Body, Param, Res, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Controller('restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    @Get()
    @UseGuards(AuthGuard)
    async getAll(@Res() res: Response) {
        try {
            const data = await this.restaurantsService.getAll();
            if (data.length === 0) {
                throw new NotFoundException('Restaurant not found');
            }

            return res.json({
                status: true,
                message: 'Get all restaurants successful',
                data: data,
            });
        } catch (error) {
            const status = error instanceof NotFoundException ? 404 : 500;
            const message = error instanceof NotFoundException ? error.message : 'Internal Server Error';
            
            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            });
        }
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async getById(@Param('id') id: string, @Res() res: Response) {
        try {
            const data = await this.restaurantsService.getById(id);
            if (!data) {
                throw new NotFoundException('Restaurant not found');
            }

            return res.json({
                status: true,
                message: 'Get restaurant by id successful',
                data,
            });
        } catch (error) {
            const status = error instanceof NotFoundException ? 404 : 500;
            const message = error instanceof NotFoundException ? error.message : 'Internal Server Error';
            
            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            });
        }
    }

    @Post()
    @UseGuards(AuthGuard, AdminGuard)
    async create(@Body() req: CreateRestaurantDto, @Res() res: Response) {
        try {
            if (!req) {
                throw new BadRequestException('Invalid data');
            }
            const data = await this.restaurantsService.create(req);

            return res.json({
                status: true,
                message: 'Create restaurant successful',
                data: data,
            });
        } catch (error) {
            const status = error instanceof BadRequestException ? 400 : 500;
            const message = error instanceof BadRequestException ? error.message : 'Internal Server Error';

            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            })
        }
    }

    @Patch(':id')
    @UseGuards(AuthGuard, AdminGuard)
    async update(@Param('id') id: string, @Body() req: UpdateRestaurantDto, @Res() res: Response) {
        try {
            if (!req) {
                throw new BadRequestException('Invalid data');
            }
            const data = await this.restaurantsService.update(id, req);

            return res.json({
                status: true,
                message: 'Update restaurant successful',
                data: data,
            });
        } catch (error) {
            const status = error instanceof BadRequestException ? 400 : 500;
            const message = error instanceof BadRequestException ? error.message : 'Internal Server Error';

            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            })
        }
    }

    @Delete(':id')
    @UseGuards(AuthGuard, AdminGuard)
    async delete(@Param('id') id: string, @Res() res: Response) {
        try {
            await this.restaurantsService.delete(id);

            return res.json({
                status: true,
                message: 'Delete restaurant successful',
                data: null,
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: null,
            })
        }
    }
}
