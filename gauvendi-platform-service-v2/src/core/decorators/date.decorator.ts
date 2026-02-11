import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsDaysOfWeekRequired(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDaysOfWeekRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // daysOfWeek must not be empty
          return Array.isArray(value) && value.length > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Days of week are required and cannot be empty';
        }
      }
    });
  };
}
