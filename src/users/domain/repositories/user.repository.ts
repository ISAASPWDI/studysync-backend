import { UpsertUserDTO } from "src/users/infrastructure/dto/user/crud/upsert-user.dto";
import { User } from "../entities/user.entity";
import { UpdateGeneralProfileDTO } from "src/users/infrastructure/dto/user/crud/update-user.dto";
import { SkillsDTO } from "src/users/infrastructure/dto/user/entities/skills.dto";
import { UpdateSkillsDTO } from "src/users/infrastructure/dto/user/crud/update-skills-user.dto";
import { UpdateAvailabilityDTO } from "src/users/infrastructure/dto/user/crud/update-availability-user.dto";

export abstract class UserRepository {
    abstract findById(id: string): Promise<Omit<User, "password"> | null>;
    abstract findByIdOrThrow(id: string): Promise<User>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract findByEmailOrThrow(email: string): Promise<User>;
    abstract create(user: User): Promise<User>;
    abstract update(userId: string, user: UpsertUserDTO): Promise<User | null>;
    abstract updateSkills(userId: string, newSkills: UpdateSkillsDTO): Promise<User | null>;
    abstract updateProfile(userId: string, body: UpdateGeneralProfileDTO): Promise<User | null>;
    abstract updateAvailability(userId: string, newValues: UpdateAvailabilityDTO): Promise<User | null>;
    abstract delete(id: string): Promise<void>;
    abstract updateLastSeen(userId: string): Promise<void>;
    abstract isUserOnline(lastSeenAt: Date | null): Promise<boolean>;
}
