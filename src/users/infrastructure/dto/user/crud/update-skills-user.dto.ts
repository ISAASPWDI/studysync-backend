import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { SkillsDTO } from "../entities/skills.dto";

export class UpdateSkillsDTO {
  @ValidateNested()
  @Type(() => SkillsDTO)
  skills?: SkillsDTO;
}