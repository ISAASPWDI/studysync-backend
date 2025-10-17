import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetMatch = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const match = request.match;
    return data ? match?.[data] : match;
  },
);