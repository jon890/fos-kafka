import {
  ArgumentsHost,
  Catch,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch(RpcException)
export class CustomRpcExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  private logger = new Logger(CustomRpcExceptionFilter.name);

  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    this.logger.error(exception);
    return throwError(() => exception.getError());
  }
}
