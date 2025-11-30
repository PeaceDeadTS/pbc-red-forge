import { z } from 'zod';

export const TagTargetType = {
  ARTICLE: 'article',
} as const;

export type TagTargetTypeValue = (typeof TagTargetType)[keyof typeof TagTargetType];

export const setTagsSchema = z.object({
  target_type: z.enum(['article']),
  target_id: z.string().uuid(),
  tags: z.array(z.string().min(1).max(50)).max(50),
});

export const getTargetTagsQuerySchema = z.object({
  target_type: z.enum(['article']),
  target_id: z.string().uuid(),
});

export const getAllTagsQuerySchema = z.object({
  target_type: z.enum(['article']).optional(),
  search: z.string().max(50).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export interface TagWithCount {
  tag: string;
  count: number;
}

export class TagsError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TagsError';
  }
}
