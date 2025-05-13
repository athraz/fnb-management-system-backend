import { Controller, Get, Post, Patch, Delete, Body, Param, Res, NotFoundException, BadRequestException, UseGuards, Req, InternalServerErrorException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CacheKey } from '@nestjs/cache-manager';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
    @CacheKey('orders_all')
    @UseGuards(AuthGuard)
    async getAll(@Res() res: Response) {
        try {
            const data = await this.ordersService.getAll();
            if (data.length === 0) {
                throw new NotFoundException('Order not found');
            }

            return res.json({
                status: true,
                message: 'Get all orders successful',
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
            const data = await this.ordersService.getById(id);
            if (!data) {
                throw new NotFoundException('Order not found');
            }

            return res.json({
                status: true,
                message: 'Get order by id successful',
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
    @UseGuards(AuthGuard)
    async create(@Body() req: CreateOrderDto, @Req() request: any, @Res() res: Response) {
        try {
            const user = request.user;
            if (!user?.userId) {
                throw new BadRequestException('Failed to get user id');
            }

            if (!req) {
                throw new BadRequestException('Invalid data');
            }
            const data = await this.ordersService.create(user.userId, req);

            return res.json({
                status: true,
                message: 'Create order successful',
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

    @Patch('prepare/:id')
    @UseGuards(AuthGuard, AdminGuard)
    async prepare(@Param('id') id: string, @Res() res: Response) {
        try {
            const data = await this.ordersService.prepare(id);

            return res.json({
                status: true,
                message: 'Change order status to prepare successful',
                data,
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

    @Patch('ready/:id')
    @UseGuards(AuthGuard, AdminGuard)
    async ready(@Param('id') id: string, @Res() res: Response) {
        try {
            const data = await this.ordersService.ready(id);

            return res.json({
                status: true,
                message: 'Change order status to ready successful',
                data,
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

    @Patch('pickup/:id')
    @UseGuards(AuthGuard, AdminGuard)
    async pickup(@Param('id') id: string, @Res() res: Response) {
        try {
            const data = await this.ordersService.pickup(id);

            return res.json({
                status: true,
                message: 'Change order status to picked up successful',
                data,
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


    @Patch('deliver/:id')
    @UseGuards(AuthGuard, AdminGuard)
    async deliver(@Param('id') id: string, @Res() res: Response) {
        try {
            const data = await this.ordersService.deliver(id);

            return res.json({
                status: true,
                message: 'Change order status to delivered successful',
                data,
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
}
