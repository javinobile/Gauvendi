import { Logger } from '@nestjs/common';

export function LogQuery(): MethodDecorator {
  const logger = new Logger('QueryLogger');

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const methodName = propertyKey.toString();
      logger.log(`[${methodName}] called with args: ${JSON.stringify(args)}`);

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
