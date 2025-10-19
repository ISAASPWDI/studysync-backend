import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { SkillsDTO } from "../entities/skills.dto";
import { ActivityDTO } from "../entities/activity.dto";

export class UpdateSkillsDTO {
  @ValidateNested()
  @Type(() => SkillsDTO)
  skills?: SkillsDTO;

  @ValidateNested()
  @Type(() => ActivityDTO)
  activity?: ActivityDTO
}