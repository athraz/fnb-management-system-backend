import { Controller, Get, Post, Patch, Delete, Body, Param, Res, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CacheKey } from '@nestjs/cache-manager';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}
    
    @Get()
    @CacheKey('categories_all')
    @UseGuards(AuthGuard)
    async getAll(@Res() res: Response) {
        try {
            const data = await this.categoriesService.getAll();
            if (data.length === 0) {
                throw new NotFoundException('Category not found');
            }

            return res.json({
                status: true,
                message: 'Get all categories successful',
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
            const data = await this.categoriesService.getById(id);
            if (!data) {
                throw new NotFoundException('Category not found');
            }

            return res.json({
                status: true,
                message: 'Get category by id successful',
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
    async create(@Body() req: CreateCategoryDto, @Res() res: Response) {
        try {
            if (!req) {
                throw new BadRequestException('Invalid data');
            }
            const data = await this.categoriesService.create(req);

            return res.json({
                status: true,
                message: 'Create category successful',
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
    async update(@Param('id') id: string, @Body() req: UpdateCategoryDto, @Res() res: Response) {
        try {
            if (!req) {
                throw new BadRequestException('Invalid data');
            }
            const data = await this.categoriesService.update(id, req);

            return res.json({
                status: true,
                message: 'Update category successful',
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
            await this.categoriesService.delete(id);

            return res.json({
                status: true,
                message: 'Delete category successful',
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
