import { Controller, Get, Post, Patch, Delete, Body, Param, Res, NotFoundException, BadRequestException, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dtos/create-menu.dto';
import { UpdateMenuDto } from './dtos/update-menu.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CacheKey } from '@nestjs/cache-manager';

@Controller('menus')
export class MenusController {
    constructor(private readonly menusService: MenusService) {}

    @Get()
    @CacheKey('menus_all')
    @UseGuards(AuthGuard)
    async getAll(@Res() res: Response) {
        try {
            const data = await this.menusService.getAll();
            if (data.length === 0) {
                throw new NotFoundException('Menu not found');
            }

            return res.json({
                status: true,
                message: 'Get all menus successful',
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
            const data = await this.menusService.getById(id);
            if (!data) {
                throw new NotFoundException('Menu not found');
            }

            return res.json({
                status: true,
                message: 'Get menu by id successful',
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
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                const originalName = file.originalname.split('.')[0];
                const ext = extname(file.originalname);
                const filename = `${originalName}_${timestamp}${ext}`;
                cb(null, filename);
            },
            }),
        }),
    )
    async create(@Body() req: CreateMenuDto, @Res() res: Response, @UploadedFile() file: Express.Multer.File) {
        try {
            if (!req) {
                throw new BadRequestException('Invalid data');
            }
            if (!file) {
                throw new BadRequestException('Image file is required');
            }

            const imageUrl = `/uploads/${file.filename}`; 
            req.imageUrl = imageUrl;

            const data = await this.menusService.create(req);

            return res.json({
                status: true,
                message: 'Create menu successful',
                data: data,
            });
        } catch (error) {
            const status = error instanceof BadRequestException ? 400 : 500;
            const message = error instanceof BadRequestException ? error.message : 'Internal Server Error';

            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            });
        }
    }


    @Patch(':id')
    @UseGuards(AuthGuard, AdminGuard)
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                const originalName = file.originalname.split('.')[0];
                const ext = extname(file.originalname);
                const filename = `${originalName}_${timestamp}${ext}`;
                cb(null, filename);
            },
            }),
        }),
    )
    async update(@Param('id') id: string, @Body() req: UpdateMenuDto, @Res() res: Response, @UploadedFile() file: Express.Multer.File,) {
        try {
            if (!req) {
                throw new BadRequestException('Invalid data');
            }

            if (file) {
                const imageUrl = `/uploads/${file.filename}`;
                req.imageUrl = imageUrl;
            }

            const data = await this.menusService.update(id, req);

            return res.json({
                status: true,
                message: 'Update menu successful',
                data: data,
            });
        } catch (error) {
            const status = error instanceof BadRequestException ? 400 : 500;
            const message = error instanceof BadRequestException ? error.message : 'Internal Server Error';

            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            });
        }
    }

    @Delete(':id')
    @UseGuards(AuthGuard, AdminGuard)
    async delete(@Param('id') id: string, @Res() res: Response) {
        try {
            await this.menusService.delete(id);

            return res.json({
                status: true,
                message: 'Delete menu successful',
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
