import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isDateRangeValid', async: false })
export class IsDateRangeValidConstraint implements ValidatorConstraintInterface {
  validate(toDate: any, args: ValidationArguments) {
    const [fromDateProperty] = args.constraints;
    const fromDate = (args.object as any)[fromDateProperty];
    
    if (!fromDate || !toDate) {
      return true; // Let other validators handle required field validation
    }
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return from <= to;
  }

  defaultMessage(args: ValidationArguments) {
    const [fromDateProperty] = args.constraints;
    return `${args.property} must be after or equal to ${fromDateProperty}`;
  }
}

export function IsDateRangeValid(fromDateProperty: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [fromDateProperty],
      validator: IsDateRangeValidConstraint,
    });
  };
}
