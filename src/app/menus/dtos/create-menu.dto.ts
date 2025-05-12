import { IsString, IsNotEmpty, IsDecimal, IsPositive } from 'class-validator';

export class CreateMenuDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @IsDecimal()
    @IsPositive()
    price: string;

    @IsDecimal()
    @IsPositive()
    stock: string;

    @IsString()
    @IsNotEmpty()
    restaurantId: string;

    @IsString()
    @IsNotEmpty()
    categoryId: string;
}