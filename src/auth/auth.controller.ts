import { Body, ConflictException, Controller, Get, HttpCode, Post, Req, Request, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthLoginResponseDTO } from './infrastructure/dto/auth-login-response.dto';
import { AuthLoginDTO } from './infrastructure/dto/auth-login.dto';
import { AuthService } from './application/auth.service';
import { RegisterUserDTO } from 'src/users/infrastructure/dto/user/crud/register-user.dto';
import type { Response } from 'express';
import { GoogleAuthService } from './infrastructure/adapters/google-auth-service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly googleService: GoogleAuthService,
        private readonly authService: AuthService,
    ) { }

    @Post("login")
    @HttpCode(200)
    @UseGuards(AuthGuard("local"))
    async login(
        @Body() credentials: AuthLoginDTO,
        @Res({ passthrough: true }) res: Response
    ): Promise<AuthLoginResponseDTO> {
        const loginResult = await this.authService.login(
            credentials.email,
            credentials.password
        );

        // Poner el token en el header Authorization
        res.setHeader('Authorization', `Bearer ${loginResult.token}`);

        return loginResult;
    }

    @Post('register')
    async register(@Body() credentials: RegisterUserDTO) {
        return await this.authService.register(credentials);
    }

    // Para web, por ahora no hace nada
    @Get('google')
    @UseGuards(AuthGuard("google"))
    async googleAuth() { }

    // Para web, por ahora no hace nada
    @Get('google/callback')
    @UseGuards(AuthGuard("google"))
    async googleAuthCallback(
        @Req() req: Request,
        @Res() res: Response
    ) {
        const user = (req as any).user;

        const loginResult = await this.authService.validateOAuthLogin(
            user.email,
            user.firstName,
            user.lastName,
            'Google'
        );

        // Redirigir al frontend con el token
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${loginResult.token}&isNewUser=${loginResult.isNewUser}`;

        res.redirect(redirectUrl);
    }


    // Para el mobile de flutter
    @Post('google/mobile')
    @HttpCode(200)
    async googleMobile(
        @Body() body: { idToken: string, action?: 'login' | 'register' },
        @Res({ passthrough: true }) res: Response
    ): Promise<AuthLoginResponseDTO> {
        const googleUser = await this.googleService.verifyToken(body.idToken);

        const { email, firstName, picture } = googleUser

        const lastName = googleUser.lastName || '';

        const existingUser = await this.authService.findUserByEmail(email);

        if (body.action === 'login' && !existingUser) throw new UnauthorizedException('No existe una cuenta asociada a este correo. Por favor regístrate primero.');

        if (body.action === 'register' && existingUser) throw new ConflictException('Ya existe una cuenta con este correo. Por favor inicia sesión.');



        const loginResult = await this.authService.validateOAuthLogin(email, firstName, lastName, 'Google', picture);

        res.setHeader('Authorization', `Bearer ${loginResult.token}`);

        return loginResult;

    }
}
