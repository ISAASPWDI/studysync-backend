// domain/user.entity.ts
import { Profile } from './profile.entity';
import { Skills } from './skills.entity';
import { Objectives } from './objectives.entity';
import { Activity } from './activity.entity';
import { Privacy } from './privacy.entity';

export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public picture?: string,
    public profile?: Profile,
    public skills?: Skills,
    public objectives?: Objectives,
    public activity?: Activity,
    public privacy?: Privacy,
    public password?: string,
  ) { }
}
