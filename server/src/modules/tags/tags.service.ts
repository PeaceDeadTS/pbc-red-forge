import { tagsRepository } from './tags.repository.js';
import { TagTargetTypeValue, TagWithCount } from './tags.types.js';

export const tagsService = {
  async setTags(targetType: TagTargetTypeValue, targetId: string, tags: string[]): Promise<void> {
    await tagsRepository.setTags(targetType, targetId, tags);
  },

  async getTags(targetType: TagTargetTypeValue, targetId: string): Promise<string[]> {
    return tagsRepository.getTags(targetType, targetId);
  },

  async getTagsForTargets(targetType: TagTargetTypeValue, targetIds: string[]): Promise<Map<string, string[]>> {
    return tagsRepository.getTagsForTargets(targetType, targetIds);
  },

  async deleteAllForTarget(targetType: TagTargetTypeValue, targetId: string): Promise<void> {
    return tagsRepository.deleteAllForTarget(targetType, targetId);
  },

  async getAllTagsForArticles(): Promise<TagWithCount[]> {
    return tagsRepository.getAllTagsForArticles();
  },
};
