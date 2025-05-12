import { IsString, IsDecimal, IsPositive, IsOptional } from 'class-validator';

export class UpdateMenuDto {
    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    imageUrl: string;

    @IsDecimal()
    @IsPositive()
    @IsOptional()
    price: string;

    @IsDecimal()
    @IsPositive()
    @IsOptional()
    stock: string;

    @IsString()
    @IsOptional()
    restaurantId: string;

    @IsString()
    @IsOptional()
    categoryId: string;
}