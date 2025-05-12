import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';

@Module({
    imports: [
        JwtModule.register({
        secret: process.env.JWT_SECRET || 'Secret', // Secret key from env or fallback
        signOptions: {
            expiresIn: '7d',
            issuer: 'Issuer',
        },
        }),
    ],
    providers: [TokenService],
    exports: [TokenService],
})

export class TokenModule {}