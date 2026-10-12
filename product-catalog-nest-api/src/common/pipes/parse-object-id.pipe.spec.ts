import { BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from './parse-object-id.pipe.js';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it('passes a valid ObjectId through', () => {
    expect(pipe.transform('652f1c2b9d3e4a0012345678')).toBe(
      '652f1c2b9d3e4a0012345678',
    );
  });

  it('throws 400 for an invalid id', () => {
    expect(() => pipe.transform('123')).toThrow(BadRequestException);
  });
});
