import { ValidationArguments, ValidationOptions, registerDecorator } from "class-validator";

// Custom validator function
export function IsValidFolderPath(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isValidPath",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") {
            return false;
          }
          if(value.split(" ").length > 1) {
            return false;
          }
          if(value.startsWith("/")) {
            return false;
          }
          if(value.endsWith("/")) {
            return false;
          }
          return true
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not start/end with slashes, must not include spaces`;
        },
      },
    });
  };
}
