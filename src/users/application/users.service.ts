import { Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repositories/user.repository';
import { CreateUserDTO } from '../infrastructure/dto/user/crud/create-user.dto';
import { User } from '../domain/entities/user.entity';
import { UpsertUserDTO } from '../infrastructure/dto/user/crud/upsert-user.dto';
import { UpdateGeneralProfileDTO } from '../infrastructure/dto/user/crud/update-user.dto';
import { SkillsDTO } from '../infrastructure/dto/user/entities/skills.dto';
import { UpdateSkillsDTO } from '../infrastructure/dto/user/crud/update-skills-user.dto';
import { UpdateAvailabilityDTO } from '../infrastructure/dto/user/crud/update-availability-user.dto';

@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UserRepository
    ) { }

    async createUser(createUserDTO: CreateUserDTO): Promise<User> {
        // Creamos la entidad de dominio
        const user = new User(
            '',
            createUserDTO.email,
            createUserDTO.password,
            createUserDTO.profile,
            createUserDTO.skills,
            createUserDTO.objectives,
            createUserDTO.activity,
            createUserDTO.privacy,
        );

        return this.userRepository.create(user);
    }
    // Actualizar el onboarding
    async upsertUser(userId: string, body: UpsertUserDTO): Promise<User | null> {
        return this.userRepository.update(userId, body);
    }
    // Actualizar solo perfil general
    async update(userId: string, body: UpdateGeneralProfileDTO): Promise<User | null> {
        return this.userRepository.updateProfile(userId, body);
    }
    // Actualizar solo skills 
    async updateSkills(userId: string, newSkills: UpdateSkillsDTO): Promise<User | null> {
        return this.userRepository.updateSkills(userId, newSkills);
    }
    async updateAvailability(userId: string, newValues: UpdateAvailabilityDTO): Promise<User | null> {
        return this.userRepository.updateAvailability(userId, newValues);
    }
    async getUserById(id: string): Promise<User | null> {
        return this.userRepository.findByIdOrThrow(id);
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }
    async updateLastSeen(userId: string): Promise<void> {
        this.userRepository.updateLastSeen(userId);

    }
    async isUserOnline(lastSeenAt: Date | null): Promise<boolean> {
        return this.userRepository.isUserOnline(lastSeenAt);
    }
}
