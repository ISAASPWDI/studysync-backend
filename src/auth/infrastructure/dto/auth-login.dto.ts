import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AuthLoginDTO {

    @IsNotEmpty()
    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    password?: string;
}