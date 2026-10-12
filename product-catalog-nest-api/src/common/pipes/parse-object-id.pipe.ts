import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import mongoose from 'mongoose';

/** Rejects route ids that are not valid MongoDB ObjectIds with a 400. */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!mongoose.isValidObjectId(value)) {
      throw new BadRequestException(`Invalid id: ${value}`);
    }
    return value;
  }
}
