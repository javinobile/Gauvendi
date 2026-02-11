import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function IsBeforeDate(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isBeforeDate",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!value || !relatedValue) {
            return true; // Let other validators handle required validation
          }

          const startDate = new Date(value);
          const endDate = new Date(relatedValue);

          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return true; // Let @IsDateString handle invalid date format
          }

          return startDate <= endDate;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be before or equal to ${relatedPropertyName}`;
        },
      },
    });
  };
}

export function IsAfterDate(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isAfterDate",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!value || !relatedValue) {
            return true; // Let other validators handle required validation
          }

          const endDate = new Date(value);
          const startDate = new Date(relatedValue);

          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return true; // Let @IsDateString handle invalid date format
          }

          return endDate >= startDate;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be after or equal to ${relatedPropertyName}`;
        },
      },
    });
  };
}

export function IsDateRangeWithinDays(maxDays: number, startDateProperty: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isDateRangeWithinDays",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxDays, startDateProperty],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [maxDays, startDatePropertyName] = args.constraints;
          const startDateValue = (args.object as any)[startDatePropertyName];

          if (!value || !startDateValue) {
            return true; // Let other validators handle required validation
          }

          const startDate = new Date(startDateValue);
          const endDate = new Date(value);

          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return true; // Let @IsDateString handle invalid date format
          }

          // Calculate the difference in days
          const timeDifference = endDate.getTime() - startDate.getTime();
          const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

          return daysDifference <= maxDays;
        },
        defaultMessage(args: ValidationArguments) {
          const [maxDays] = args.constraints;
          return `Date range cannot exceed ${maxDays} days`;
        },
      },
    });
  };
}

export function IsDateRangeWithinMonths(maxMonths: number, startDateProperty: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isDateRangeWithinMonths",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxMonths, startDateProperty],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [maxMonths, startDatePropertyName] = args.constraints;
          const startDateValue = (args.object as any)[startDatePropertyName];

          if (!value || !startDateValue) {
            return true; // Let other validators handle required validation
          }

          const startDate = new Date(startDateValue);
          const endDate = new Date(value);

          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return true; // Let @IsDateString handle invalid date format
          }

          // Calculate the difference in months
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth();
          const endYear = endDate.getFullYear();
          const endMonth = endDate.getMonth();

          const monthsDifference = (endYear - startYear) * 12 + (endMonth - startMonth);

          return monthsDifference < maxMonths;
        },
        defaultMessage(args: ValidationArguments) {
          const [maxMonths] = args.constraints;
          return `Date range cannot exceed ${maxMonths} months`;
        },
      },
    });
  };
}
