import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { CreateUserDTO } from './infrastructure/dto/user/crud/create-user.dto';
import { User } from './domain/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { UpsertUserDTO } from './infrastructure/dto/user/crud/upsert-user.dto';
import { GetUser } from './infrastructure/decorators/get-user.decorator';
import { UpdateGeneralProfileDTO } from './infrastructure/dto/user/crud/update-user.dto';
import { UpdateSkillsDTO } from './infrastructure/dto/user/crud/update-skills-user.dto';
import { UpdateAvailabilityDTO } from './infrastructure/dto/user/crud/update-availability-user.dto';
import { UserResponseDTO } from './infrastructure/dto/user/entities/user-response.dto';


@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }
    @Post()
    async createUser(@Body() userDTO: CreateUserDTO) {
        const user = await this.usersService.createUser(userDTO);
        return user;
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    async getUserProfile(
        @GetUser('id') userId: string,
    ): Promise<UserResponseDTO | null> {
        const user = await this.usersService.getUserById(userId);
        await this.usersService.updateLastSeen(userId);
        return user;
    }

    @Put('profile')
    @UseGuards(AuthGuard('jwt'))
    async upsertProfile(
        @GetUser('id') userId: string,
        @Body() body: UpsertUserDTO
    ): Promise<User | null> {
        const user = await this.usersService.upsertUser(userId, body);
        return user;
    }
    @Patch('profile')
    @UseGuards(AuthGuard('jwt'))
    async updateGeneralProfile(
        @GetUser('id') userId: string,
        @Body() body: UpdateGeneralProfileDTO
    ): Promise<User | null> {
        const user = await this.usersService.update(userId, body);
        return user;
    }

    @Patch('profile/skills')
    @UseGuards(AuthGuard('jwt'))
    async updateSkills(
        @GetUser('id') userId: string,
        @Body() body: UpdateSkillsDTO
    ): Promise<User | null> {
        console.log("body received: ", body);
        
        const user = await this.usersService.updateSkills(userId, body);
        return user;
    }

    @Patch('profile/availability')
    @UseGuards(AuthGuard('jwt'))
    async updateAvailability(
        @GetUser('id') userId: string,
        @Body() newValues: UpdateAvailabilityDTO
    ): Promise<Omit<User, "password"> | null> {
        const user = await this.usersService.updateAvailability(userId, newValues);
        return user;
    }

    @Patch('last-seen')
    @UseGuards(AuthGuard('jwt'))
    async updateLastSeen(@GetUser('id') userId: string) {
        await this.usersService.updateLastSeen(userId);
        return {
            success: true,
            lastSeenAt: new Date().toISOString()
        };
    }
    @Get(':userId')
    @UseGuards(AuthGuard('jwt'))
    async getUserById(
        @Param('userId') userId: string,
    ): Promise<Omit<User, 'password'> | null> {
        const user = await this.usersService.getUserById(userId);
        return user;
    }

}
