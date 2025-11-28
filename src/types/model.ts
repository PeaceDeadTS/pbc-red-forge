export type ModelType =
  | 'checkpoint'
  | 'lora'
  | 'textualInversion'
  | 'hypernetwork'
  | 'aestheticGradient'
  | 'controlnet'
  | 'poses';

export interface ModelVersion {
  id: string;
  name: string;
  createdAt: string;
  downloadUrl: string;
  trainedWords: string[];
  baseModel: string;
  images: string[];
}

export interface Model {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  tags: string[];
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  coverImage: string;
  images: string[];
  versions: ModelVersion[];
  stats: {
    downloads: number;
    likes: number;
    rating: number;
    views: number;
  };
  createdAt: string;
  updatedAt: string;
}
