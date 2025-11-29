import { z } from 'zod';

/**
 * Generation Module Types
 * 
 * This module is a placeholder for the future Generation Service.
 * When implemented, it will handle AI model inference requests.
 * 
 * Architecture notes:
 * - This module is designed to be easily extractable as a separate microservice
 * - Communication will be async via job queue (Redis + BullMQ recommended)
 * - GPU workers can scale independently from the main API
 */

// Job status enum
export const GenerationStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type GenerationStatusType = typeof GenerationStatus[keyof typeof GenerationStatus];

// Validation schemas for future implementation
export const createGenerationJobSchema = z.object({
  model_id: z.string().uuid(),
  prompt: z.string().min(1).max(10000),
  negative_prompt: z.string().max(10000).optional(),
  parameters: z.object({
    width: z.number().int().min(64).max(2048).optional(),
    height: z.number().int().min(64).max(2048).optional(),
    steps: z.number().int().min(1).max(150).optional(),
    cfg_scale: z.number().min(1).max(30).optional(),
    seed: z.number().int().optional(),
    sampler: z.string().optional(),
  }).optional(),
});

export type CreateGenerationJobInput = z.infer<typeof createGenerationJobSchema>;

// Response types
export interface GenerationJob {
  id: string;
  user_id: string;
  model_id: string;
  status: GenerationStatusType;
  prompt: string;
  negative_prompt: string | null;
  parameters: Record<string, unknown>;
  result_url: string | null;
  error_message: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface GenerationJobResponse {
  job: GenerationJob;
}

export interface GenerationJobsListResponse {
  jobs: GenerationJob[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Future queue message format for worker communication
 */
export interface GenerationQueueMessage {
  jobId: string;
  userId: string;
  modelId: string;
  prompt: string;
  negativePrompt: string | null;
  parameters: {
    width: number;
    height: number;
    steps: number;
    cfgScale: number;
    seed: number;
    sampler: string;
  };
}

/**
 * Worker result message format
 */
export interface GenerationResultMessage {
  jobId: string;
  success: boolean;
  resultUrl?: string;
  errorMessage?: string;
  processingTimeMs?: number;
}
