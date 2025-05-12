import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { LoginUserDto } from './dtos/login-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TokenService } from 'src/common/token/token.service';
import * as bcrypt from 'bcrypt'; 

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenService: TokenService,
    ) {}

    async login(req: LoginUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { username: req.username },
        });

        if (!user) {
            throw new NotFoundException('Username tidak terdaftar');
        }

        const checkPassword = await bcrypt.compare(req.password, user.password);

        if (!checkPassword) {
            throw new UnauthorizedException('Password salah');
        }

        const token = this.tokenService.generateToken(user.id, user.role);

        return {
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
    }
}
