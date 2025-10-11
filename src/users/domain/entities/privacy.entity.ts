// domain/privacy.entity.ts
export class Privacy {
constructor(
public showAge: boolean = true,
public showLocation: boolean = true,
public showSemester: boolean = true,
) {}
}