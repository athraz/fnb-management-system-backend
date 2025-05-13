import { IsDecimal, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class CreateOrderMenuDto {
    @IsString()
    @IsNotEmpty()
    menuId: string;

    @IsDecimal()
    @IsPositive()
    count: string;
}


export class CreateOrderDto {
    @IsDecimal()
    @IsPositive()
    address: string;

    menus: CreateOrderMenuDto[]
}