// domain/location.entity.ts
export class Location {
    constructor(
        public district?: string,
        public coordinates?: number[]
    ) { }
}