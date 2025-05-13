import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TokenService } from 'src/common/token/token.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

jest.mock('src/common/prisma/prisma.service');
jest.mock('src/common/token/token.service');
jest.mock('bcrypt');

describe('UsersService', () => {
    let service: UsersService;
    let prismaService: PrismaService;
    let tokenService: TokenService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: TokenService,
                    useValue: {
                        generateToken: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prismaService = module.get<PrismaService>(PrismaService);
        tokenService = module.get<TokenService>(TokenService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return token when valid username and password are provided', async () => {
            const loginDto = { 
                username: 'test', 
                password: 'password123', 
            };
            const user = { 
                id: uuidv4(), 
                username: loginDto.username, 
                password: 'hashedPassword',
                role: 'user',
            };
            const token = 'some-jwt-token';

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            jest.spyOn(tokenService, 'generateToken').mockReturnValue(token);

            const result = await service.login(loginDto);

            expect(result).toEqual({
                token,
                expiresAt: expect.any(Date),
            });
        });

        it('should throw NotFoundException when username is not registered', async () => {
            const loginDto = { 
                username: 'test', 
                password: 'password123',
            };

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw UnauthorizedException when password is invalid', async () => {
            const loginDto = { 
                username: 'test', 
                password: 'wrongPassword',
            };
            const user = { 
                id: uuidv4(), 
                username: loginDto.username, 
                password: 'hashedPassword',
                role: 'user',
            };

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });
});
