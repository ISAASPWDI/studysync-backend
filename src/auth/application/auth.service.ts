import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../domain/repositories/auth.repository';
import { User } from '../../users/domain/entities/user.entity';
import { AuthLoginResponseDTO, Providers } from '../infrastructure/dto/auth-login-response.dto';
import { RegisterUserDTO } from 'src/users/infrastructure/dto/user/crud/register-user.dto';


@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService
    ) { }

    async login(email: string, password?: string): Promise<AuthLoginResponseDTO> {
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        let sessionMethod: Providers;

        if (user.password && password) {

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');
            sessionMethod = 'Manual';

        } else {
            throw new UnauthorizedException('Método de autenticación inválido');
        }

        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload);

        const userResponse = new User(
            user.id,
            user.email,
            user.picture,
            user.profile,
            user.skills,
            user.objectives,
            user.activity,
            user.privacy
        );

        return { user: userResponse, token, sessionMethod };
    }

    async register(registerDTO: RegisterUserDTO): Promise<AuthLoginResponseDTO> {
        const defaultPicture = 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png';
        const existingUser = await this.authRepository.findUserByEmail(registerDTO.email);

        if (existingUser) {
            throw new ConflictException('El usuario ya existe con este email');
        }

        if (!registerDTO.password) {
            throw new ConflictException('Tu no tienes contraseña, eres un usuario OAuth');
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(registerDTO.password, saltRounds);

        const newUser = new User(
            '',
            registerDTO.email,
            defaultPicture,
            registerDTO.profile,
            registerDTO.skills,
            registerDTO.objectives,
            registerDTO.activity,
            registerDTO.privacy,
            hashedPassword
        );

        const savedUser = await this.authRepository.createUser(newUser);

        // Generar token JWT para el nuevo usuario
        const payload = { sub: savedUser.id, email: savedUser.email };
        const token = this.jwtService.sign(payload);

        const userResponse = new User(
            savedUser.id,
            savedUser.email,
            undefined,
            savedUser.profile,
            savedUser.skills,
            savedUser.objectives,
            savedUser.activity,
            savedUser.privacy
        );

        return {
            user: userResponse,
            token,
            sessionMethod: 'Manual',
            picture: defaultPicture
        };
    }

    async validateUserWithPassword(email: string, password: string): Promise<User | null> {
        const user = await this.authRepository.findUserByEmail(email);
        if (!user || !user.password) throw new UnauthorizedException("No existe una cuenta asociada a este correo");

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return new User(
            user.id,
            user.email,
            undefined,
            user.profile,
            user.skills,
            user.objectives,
            user.activity,
            user.privacy
        );
    }
    async findUserByEmail(email: string): Promise<User | null> {
        return await this.authRepository.findUserByEmail(email);
    }
    // Método para manejar OAuth
    async validateOAuthLogin(
        email: string,
        firstName: string,
        lastName: string,
        provider: Providers,
        picture?: string
    ): Promise<AuthLoginResponseDTO> {
        let user = await this.authRepository.findUserByEmail(email);
        let isNewUser = false;
        if (!user) {
            const newUser = new User(
                '',
                email,
                picture,
                undefined,   // sin password (OAuth)
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            );

            user = await this.authRepository.createUser(newUser);
            isNewUser = true;
        }

        // const profile = new Profile(
        //     firstName,
        //     lastName || '',
        //     0, // edad por defecto
        //     0, // semestre por defecto
        //     '', // universidad
        //     '', // facultad
        //     new Location('', []), // location vacío
        //     '', // profilePicture
        //     ''  // bio
        // );

        // const skills = new Skills([]); // sin skills al inicio
        // const objectives = new Objectives([]); // sin objetivos

        // const activity = new Activity(
        //     new Date(),  // lastActive
        //     true,        // isOnline
        //     new Date(),  // joinDate
        //     0            // profileCompletion
        // );

        // const privacy = new Privacy(
        //     true, // showAge
        //     true, // showLocation
        //     true  // showSemester
        // );




        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload);

        const userResponse = new User(
            user.id,
            user.email,
            user.picture,
            user.profile,
            user.skills,
            user.objectives,
            user.activity,
            user.privacy
        );

        return { user: userResponse, token, sessionMethod: provider, isNewUser, picture };
    }
}
