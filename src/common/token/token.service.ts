import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
    private readonly logger = new Logger(TokenService.name);
    private readonly secretKey: string;
    private readonly issuer: string = 'Secret';
    private readonly invalidate: Map<string, Date> = new Map();

    constructor(private readonly jwtService: JwtService) {
        this.secretKey = process.env.JWT_SECRET || 'Secret';
    }

    generateToken(userId: string, role: string): string {
        const payload = {
            userId,
            role,
        };

        const options = {
            expiresIn: '7d',
            issuer: this.issuer,
        };

        try {
        return this.jwtService.sign(payload, {
            secret: this.secretKey,
            ...options,
        });
        } catch (error) {
            this.logger.error('Error generating token', error);
            throw new Error('Could not generate token');
        }
    }

    async validateToken(token: string): Promise<any> {
        if (this.invalidate.has(token)) {
            throw new Error('Token sudah tidak valid');
        }

        try {
            const decoded = this.jwtService.verify(token, { secret: this.secretKey });
        return decoded;
        } catch (error) {
            this.logger.error('Invalid token', error);
            throw new Error('Invalid token');
        }
    }

    invalidateToken(token: string): void {
        if (this.invalidate.has(token)) {
            throw new Error('Token sudah tidak valid');
        }

        this.invalidate.set(token, new Date());
    }
}
