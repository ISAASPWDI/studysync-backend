import { User } from "src/users/domain/entities/user.entity";

export type Providers = 'Manual' | 'Google' | 'Github';

export class AuthLoginResponseDTO {
    user: User;
    sessionMethod: Providers;
    token: String;
    picture?: String;
    isNewUser?: boolean;
}