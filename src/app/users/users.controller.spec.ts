import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TokenService } from 'src/common/token/token.service';
import { Response } from 'express';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './dtos/login-user.dto';

jest.mock('./users.service');
jest.mock('src/common/token/token.service');

describe('UsersController', () => {
    let controller: UsersController;
    let usersService: UsersService;
    let tokenService: TokenService;
    let response: Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                UsersService,
                TokenService,
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        usersService = module.get<UsersService>(UsersService);
        tokenService = module.get<TokenService>(TokenService);

        response = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
            header: jest.fn(),
        } as unknown as Response;
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should successfully login and return user data', async () => {
            const loginDto: LoginUserDto = { 
                username: 'test', 
                password: 'password123', 
            };
            const result = { 
                token: 'some-token',
                expiresAt: new Date('2025-05-20T00:00:00.000Z')
            };
            jest.spyOn(usersService, 'login').mockResolvedValue(result);

            await controller.login(loginDto, response);

            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Login user successful',
                data: result,
            });
        });

        it('should return 400 if request data is invalid', async () => {
            const loginDto: LoginUserDto = { 
                username: '', 
                password: '',
            };

            await controller.login(loginDto, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Invalid data',
                data: null,
            });
        });

        it('should return 400 if credentials are incorrect', async () => {
            const loginDto: LoginUserDto = { 
                username: 'wrongUser', 
                password: 'wrongPassword',
            };

            jest.spyOn(usersService, 'login').mockRejectedValue(new BadRequestException('Invalid credentials'));

            await controller.login(loginDto, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Invalid credentials',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const loginDto: LoginUserDto = { 
                username: 'test', 
                password: 'password123',
            };
            jest.spyOn(usersService, 'login').mockRejectedValue(new Error('Unexpected failure'));

            await controller.login(loginDto, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });

    describe('logout', () => {
        it('should successfully logout and invalidate token', async () => {
            const token = 'some-valid-token';
            const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
            jest.spyOn(tokenService, 'invalidateToken').mockImplementation(() => {});

            await controller.logout(req, response);

            expect(tokenService.invalidateToken).toHaveBeenCalledWith(token);
            expect(response.json).toHaveBeenCalledWith({
                status: true,
                message: 'Logout user successful',
                data: null,
            });
        });

        it('should return 400 if token is missing', async () => {
            const req = { headers: {} } as unknown as Request;

            await controller.logout(req, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Token is missing',
                data: null,
            });
        });

        it('should return 400 if invalid token error occurs', async () => {
            const token = 'invalid-token';
            const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
            jest.spyOn(tokenService, 'invalidateToken').mockImplementationOnce(() => {
                throw new BadRequestException('Token has already invalidated');
            });

            await controller.logout(req, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Token has already invalidated',
                data: null,
            });
        });

        it('should return 500 when an unexpected error occurs', async () => {
            const token = 'some-valid-token';
            const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
            jest.spyOn(tokenService, 'invalidateToken').mockImplementationOnce(() => {
                throw new Error('Unexpected failure');
            });

            await controller.logout(req, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                status: false,
                message: 'Internal Server Error',
                data: null,
            });
        });
    });
});
