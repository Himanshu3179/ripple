import api from './api';
import type { StoryverseSceneNode, StoryverseStorySummary } from '../types';

interface StoryResponse {
  story: StoryverseStorySummary;
  scenes: StoryverseSceneNode[];
}

export const fetchStoryverseStories = async (search?: string) => {
  const params = new URLSearchParams();
  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  }
  const query = params.toString();
  const path = query ? `/storyverse?${query}` : '/storyverse';
  const { data } = await api.get<{ stories: StoryverseStorySummary[] }>(path);
  return data.stories;
};

export const fetchStoryverseStory = async (storyId: string) => {
  const { data } = await api.get<StoryResponse>(`/storyverse/${storyId}`);
  return data;
};

export const createStoryverseStory = async (payload: {
  title: string;
  summary?: string;
  openingScene: string;
  tags?: string[];
  visibility?: 'public' | 'community' | 'private';
}) => {
  const { data } = await api.post<{ story: StoryverseStorySummary; rootScene: StoryverseSceneNode }>(
    '/storyverse',
    payload,
  );
  return data;
};

export const addStoryverseScene = async (
  storyId: string,
  payload: { parentSceneId?: string | null; choiceLabel?: string; content: string },
) => {
  const { data } = await api.post<{ scene: StoryverseSceneNode }>(
    `/storyverse/${storyId}/scenes`,
    payload,
  );
  return data.scene;
};
