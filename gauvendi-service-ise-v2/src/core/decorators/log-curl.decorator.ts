import { Logger } from '@nestjs/common';
import { getCurlCommand } from 'src/core/utils/curl.util';

export function LogCurl(): MethodDecorator {
  const logger = new Logger('CurlLogger');

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find((a) => a?.headers); // detect @Req
      const body = args.find((a) => typeof a === 'object' && !a?.headers); // detect @Body

      if (req && body) {
        const curl = getCurlCommand(
          req.url ?? propertyKey.toString(),
          req.method ?? 'POST',
          req.headers as Record<string, string>,
          body
        );
        logger.log(`Curl command: ${curl}`);
      }

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
