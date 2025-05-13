import { Controller, Get, Post, Patch, Delete, Body, Param, Res, NotFoundException, BadRequestException, UnauthorizedException, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginUserDto } from './dtos/login-user.dto';
import { Response } from 'express';
import { TokenService } from 'src/common/token/token.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly tokenService: TokenService
    ) {}
    
    @Post('login')
    async login(@Body() req: LoginUserDto, @Res() res: Response) {
        try {
            if (!req || Object.values(req).some(value => value === '')) {
                throw new BadRequestException('Invalid data');
            }
            const data = await this.usersService.login(req)

            return res.json({
                status: true,
                message: 'Login user successful',
                data: data,
            });
        } catch (error) {
            const status = error instanceof BadRequestException ||
                        error instanceof UnauthorizedException ||
                        error instanceof NotFoundException
                        ? 400
                        : 500;

            const message = error instanceof BadRequestException ||
                        error instanceof UnauthorizedException ||
                        error instanceof NotFoundException
                        ? error.message 
                        : 'Internal Server Error';

            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            });
        }
    }


    @Post('logout')
    async logout(@Req() req: Request, @Res() res: Response) {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(400).json({
                status: false,
                message: 'Token is missing',
                data: null,
            });
        }

        try {
            await this.tokenService.invalidateToken(token);

            res.cookie('token', '', { maxAge: 0, path: '/' });
            res.header('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');

            return res.json({
                status: true,
                message: 'Logout user successful',
                data: null,
            });
        } catch (error) {
            const status = error instanceof BadRequestException ||
                            error instanceof UnauthorizedException ||
                            error instanceof NotFoundException
                            ? 400
                            : 500;

            const message = error instanceof BadRequestException ||
                            error instanceof UnauthorizedException ||
                            error instanceof NotFoundException
                            ? error.message 
                            : 'Internal Server Error';

            return res.status(status).json({
                status: false,
                message: message,
                data: null,
            });
        }
    }
}