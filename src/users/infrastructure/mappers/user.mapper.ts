// src/users/infrastructure/mappers/user.mapper.ts
import { User } from "../../domain/entities/user.entity";
import { Profile } from "../../domain/entities/profile.entity";
import { Skills } from "../../domain/entities/skills.entity";
import { Objectives } from "../../domain/entities/objectives.entity";
import { Activity } from "../../domain/entities/activity.entity";
import { Privacy } from "../../domain/entities/privacy.entity";
import { Location } from "../../domain/entities/location.entity";
import { UserDocument } from "../schemas/user/user.schema";
import { User as UserSchema } from '../schemas/user/user.schema';
import { Profile as ProfileSchema } from '../schemas/user/profile.schema';
import { Skills as SkillsSchema } from '../schemas/user/skills.schema';
import { Objectives as ObjectivesSchema } from '../schemas/user/objectives.schema';
import { Activity as ActivitySchema } from '../schemas/user/activity.schema';
import { Privacy as PrivacySchema } from '../schemas/user/privacy.schema';
import { Location as LocationSchema } from '../schemas/common/location.schema';
import { ProfileDTO } from "../dto/user/entities/profile.dto";
import { SkillsDTO } from "../dto/user/entities/skills.dto";
import { ObjectivesDTO } from "../dto/user/entities/objectives.dto";
import { ActivityDTO } from "../dto/user/entities/activity.dto";
import { PrivacyDTO } from "../dto/user/entities/privacy.dto";
import { LocationDTO } from "../dto/user/entities/location.dto";
import { UpsertUserDTO } from "../dto/user/crud/upsert-user.dto";

export class UserMapper {
    // dto -> domain
    static locationToEntity(dto?: LocationDTO): Location | undefined {
        if (!dto) return undefined;

        return new Location(
            dto.district!,
            dto.coordinates!
        );
    }
    static profileToEntity(dto?: ProfileDTO): Profile | undefined {
        if (!dto) return undefined;

        return new Profile(
            dto.firstName!,
            dto.lastName!,
            dto.age!,
            dto.semester!,
            dto.university!,
            dto.faculty!,
            this.locationToEntity(dto.location),
            dto.profilePicture,
            dto.bio
        );
    }

    static skillsToEntity(dto?: SkillsDTO): Skills | undefined {
        if (!dto) return undefined;

        return new Skills(
            dto.technical!,
            dto.interests
        );
    }

    static objectivesToEntity(dto?: ObjectivesDTO): Objectives | undefined {
        if (!dto) return undefined;

        return new Objectives(
            dto.primary!,
            dto.timeAvailability,
            dto.preferredGroupSize
        );
    }

    static activityToEntity(dto?: ActivityDTO): Activity | undefined {
        if (!dto) return undefined;

        return new Activity(
            dto.lastActive!,
            dto.isOnline,
            dto.joinDate!,
            dto.profileCompletion!
        );
    }

    static privacyToEntity(dto?: PrivacyDTO): Privacy | undefined {
        if (!dto) return undefined;

        return new Privacy(
            dto.showAge,
            dto.showLocation,
            dto.showSemester
        );
    }
    // Infra -> Domain
    static toDomain(userDoc: UserDocument): User {
        return new User(
            userDoc._id.toString(),
            userDoc.email,
            userDoc.picture,
            this.mapProfile(userDoc.profile),
            this.mapSkills(userDoc.skills),
            this.mapObjectives(userDoc.objectives),
            this.mapActivity(userDoc.activity),
            this.mapPrivacy(userDoc.privacy),
            userDoc.password,
        );
    }

    // Domain -> Infra (para persistencia en Mongo)
    static toPersistence(user: User): Omit<UserSchema, '_id'> {
        return {
            email: user.email,
            picture: user.picture,
            password: user.password,
            profile: this.mapProfileToPersistence(user.profile),
            skills: this.mapSkillsToPersistence(user.skills),
            objectives: this.mapObjectivesToPersistence(user.objectives),
            activity: this.mapActivityToPersistence(user.activity),
            privacy: this.mapPrivacyToPersistence(user.privacy),
        };
    }
    static toSkillsPersistence(skills: Pick<UpsertUserDTO, "skills">): Pick<UserSchema, "skills"> {
        const formattedSkills = this.skillsToEntity(skills.skills)
        return {
            skills: this.mapSkillsToPersistence(formattedSkills)
        }
    }
    static toObjectivesPersistence(values: ObjectivesDTO): Pick<UserSchema, "objectives"> {
        const formattedObjectives = this.objectivesToEntity(values);
        return {
            objectives: this.mapObjectivesToPersistence(formattedObjectives)
        }
    }
    // ----- Profile -----
    private static mapProfile(profile?: ProfileSchema): Profile | undefined {
        if (!profile) return undefined;
        return new Profile(
            profile.firstName,
            profile.lastName,
            profile.age,
            profile.semester,
            profile.university,
            profile.faculty,
            this.mapLocation(profile.location),
            profile.profilePicture,
            profile.bio
        );
    }

    private static mapProfileToPersistence(profile?: Profile): ProfileSchema | undefined {
        if (!profile) return undefined;
        return {
            firstName: profile.firstName,
            lastName: profile.lastName,
            age: profile.age,
            semester: profile.semester,
            university: profile.university,
            faculty: profile.faculty,
            profilePicture: profile.profilePicture,
            bio: profile.bio,
            location: this.mapLocationToPersistence(profile.location),
        } as ProfileSchema;
    }

    // ----- Location -----
    private static mapLocation(location?: LocationSchema): Location | undefined {
        if (!location) return undefined;
        return new Location(location.district, location.coordinates);
    }

    private static mapLocationToPersistence(location?: Location): LocationSchema | undefined {
        if (!location) return undefined;
        return {
            district: location.district,
            coordinates: location.coordinates
        } as LocationSchema;
    }

    // ----- Skills -----
    private static mapSkills(skills?: SkillsSchema): Skills | undefined {
        if (!skills) return undefined;
        return new Skills(skills.technical, skills.interests);
    }

    private static mapSkillsToPersistence(skills?: Skills): SkillsSchema | undefined {
        if (!skills) return undefined;
        return {
            technical: skills.technical,
            interests: skills.interests,
        } as SkillsSchema;
    }

    // ----- Objectives -----
    private static mapObjectives(objectives?: ObjectivesSchema): Objectives | undefined {
        if (!objectives) return undefined;
        return new Objectives(
            objectives.primary,
            objectives.timeAvailability,
            objectives.preferredGroupSize,
        );
    }

    private static mapObjectivesToPersistence(objectives?: Objectives): ObjectivesSchema | undefined {
        if (!objectives) return undefined;
        return {
            primary: objectives.primary,
            timeAvailability: objectives.timeAvailability,
            preferredGroupSize: objectives.preferredGroupSize,
        } as ObjectivesSchema;
    }

    // ----- Activity -----
    private static mapActivity(activity?: ActivitySchema): Activity | undefined {
        if (!activity) return undefined;
        return new Activity(
            activity.lastActive,
            activity.isOnline,
            activity.joinDate,
            activity.profileCompletion,
        );
    }

    private static mapActivityToPersistence(activity?: Activity): ActivitySchema | undefined {
        if (!activity) return undefined;
        return {
            lastActive: activity.lastActive,
            isOnline: activity.isOnline,
            joinDate: activity.joinDate,
            profileCompletion: activity.profileCompletion,
        } as ActivitySchema;
    }

    // ----- Privacy -----
    private static mapPrivacy(privacy?: PrivacySchema): Privacy | undefined {
        if (!privacy) return undefined;
        return new Privacy(
            privacy.showAge,
            privacy.showLocation,
            privacy.showSemester,
        );
    }

    private static mapPrivacyToPersistence(privacy?: Privacy): PrivacySchema | undefined {
        if (!privacy) return undefined;
        return {
            showAge: privacy.showAge,
            showLocation: privacy.showLocation,
            showSemester: privacy.showSemester,
        } as PrivacySchema;
    }
}