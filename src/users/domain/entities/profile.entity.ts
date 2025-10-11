// domain/profile.entity.ts

import { Location } from "./location.entity";

export class Profile {
    constructor(
        public firstName: string,
        public lastName: string,
        public age: number,
        public semester: number,
        public university: string,
        public faculty: string,
        public location?: Location,
        public profilePicture?: string,
        public bio?: string,
    ) { }
}