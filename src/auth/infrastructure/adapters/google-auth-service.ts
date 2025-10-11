import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";

@Injectable()
export class GoogleAuthService {
    private readonly client: OAuth2Client;

    constructor(
        private configService: ConfigService
    ){
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        this.client = new OAuth2Client(clientId);
    }

    async verifyToken( idToken : string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        picture?: string;
    }> {
        try {
            const ticket =  await this.client.verifyIdToken({
                idToken,
                audience: [
                    this.configService.get<string>('GOOGLE_CLIENT_ID')!,
                    this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID')!
                ]
            });

            const payload = ticket.getPayload();

            if( !payload || !payload.email) throw new UnauthorizedException('Token inválido')

            if ( !payload.email_verified ) throw new UnauthorizedException('Email no verificado');

            return {
                firstName: payload.given_name!,
                lastName: payload.family_name!,
                email: payload.email,
                picture: payload.picture ?? 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png'
            }

        } catch (error) {
            throw new UnauthorizedException('Error al verificar el token de Google');
        }


    }
}