import "reflect-metadata"; // Required for class transformer to work;
import { Expose } from "class-transformer";
import { BasicUserPassword } from "../../../core/user";

export class UserPassword extends BasicUserPassword {
  @Expose() salt: string;
  @Expose() passwordHash: string;
}
