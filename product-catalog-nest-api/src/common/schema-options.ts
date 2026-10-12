import type { SchemaOptions } from '@nestjs/mongoose';

/**
 * Shared schema options:
 *  - createdDate / updatedDate set automatically
 *  - JSON output exposes `id` (string) instead of `_id`, and hides `__v`
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
};
