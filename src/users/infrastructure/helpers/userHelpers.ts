import { User } from "src/users/domain/entities/user.entity";
import { UpsertUserDTO } from "../dto/user/crud/upsert-user.dto";
import { UserMapper } from "../mappers/user.mapper";

export class UserHelpers {
    static buildUpdateUser(existingUser: User, updateData: Partial<UpsertUserDTO>): User {


        return new User(
            existingUser.id,
            updateData.email ?? existingUser.email,
            existingUser.picture,
            updateData.profile
                ? UserMapper.profileToEntity(updateData.profile)
                : existingUser.profile,
            updateData.skills
                ? UserMapper.skillsToEntity(updateData.skills)
                : existingUser.skills,
            updateData.objectives
                ? UserMapper.objectivesToEntity(updateData.objectives)
                : existingUser.objectives,
            updateData.activity
                ? UserMapper.activityToEntity(updateData.activity)
                : existingUser.activity,
            updateData.privacy
                ? UserMapper.privacyToEntity(updateData.privacy)
                : existingUser.privacy,
            existingUser.password,
        );
    }
}