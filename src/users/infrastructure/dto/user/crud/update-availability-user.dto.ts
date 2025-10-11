import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { SkillsDTO } from "../entities/skills.dto";
import { ObjectivesDTO } from "../entities/objectives.dto";

export class UpdateAvailabilityDTO {
  @ValidateNested()
  @Type(() => ObjectivesDTO)
  objectives?: ObjectivesDTO;
}