// domain/objectives.entity.ts
export class Objectives {
constructor(
public primary: string[],
public timeAvailability?: string,
public preferredGroupSize?: string,
) {}
}