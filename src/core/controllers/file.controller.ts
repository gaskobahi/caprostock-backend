import { CustomApiErrorResponse } from '@app/nestjs';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { ApiTags } from '@nestjs/swagger';
import { imageFileFilter, limitsParams, storageproducts } from 'src/helpers/imageStorage';
import { ApiAuthJwtHeader } from 'src/modules/auth/decorators/api-auth-jwt-header.decorator';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('files')
@Controller('files')
export class FileController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageproducts,
      fileFilter: imageFileFilter,
      limits: limitsParams,
    }),
  )
  async uploadFile(@UploadedFile() file) {
    if (!file) {
      throw new Error('No file upload');
    }

    console.log('File Upload', file);
    return { message: 'File upload successfully' };
  }
}
