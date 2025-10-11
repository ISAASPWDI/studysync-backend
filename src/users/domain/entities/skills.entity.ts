// domain/skills.entity.ts
export class Skills {
    constructor(
        public technical: string[],
        public interests?: string[],
    ) { }
}