import { apiRequest } from '../../../services/apiClient';
import {
  DEFAULT_CATEGORY_OPTIONS,
  type CategoryOptionItem,
} from '../components/CategorySelect';
import type { CategoryPayload } from '../components/CategoryManager';

interface RawCategoryResponse {
  id?: string;
  _id?: string;
  name?: string;
  label?: string;
  value?: string;
  type?: 'expense' | 'income';
  color?: CategoryOptionItem['color'];
  iconName?: string;
  isDefault?: boolean;
}

function normalizeCategory(raw: RawCategoryResponse): CategoryOptionItem {
  const displayName = String(raw.label ?? raw.name ?? raw.value ?? 'Uncategorized').trim();

  return {
    id: String(raw.id ?? raw._id ?? ''),
    value: String(raw.value ?? raw.name ?? displayName).trim(),
    label: displayName,
    type: raw.type === 'income' ? 'income' : 'expense',
    color: raw.color ?? 'neutral',
    iconName: raw.iconName?.trim() || 'IconCategory',
    isDefault: Boolean(raw.isDefault),
  };
}

export const categoryService = {
  isRemoteEnabled(): boolean {
    return true;
  },

  async getAll(): Promise<CategoryOptionItem[]> {
    const data = await apiRequest<
      | { categories?: RawCategoryResponse[]; data?: RawCategoryResponse[] }
      | RawCategoryResponse[]
    >('/categories');

    const list: RawCategoryResponse[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.categories)
      ? data.categories
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return list.map(normalizeCategory);
  },

  async create(payload: CategoryPayload): Promise<CategoryOptionItem> {
    const trimmedLabel = payload.label.trim();
    if (!trimmedLabel) {
      throw new Error('Category name is required.');
    }

    const data = await apiRequest<
      { category?: RawCategoryResponse; data?: RawCategoryResponse } & RawCategoryResponse
    >('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: trimmedLabel,
        label: trimmedLabel,
        value: trimmedLabel,
        type: payload.type,
        color: payload.color,
        iconName: payload.iconName,
      }),
    });

    const created: RawCategoryResponse = data?.category ?? data?.data ?? data;
    return normalizeCategory(created);
  },

  async update(
    id: string,
    payload: CategoryPayload
  ): Promise<CategoryOptionItem> {
    const trimmedLabel = payload.label.trim();
    if (!trimmedLabel) {
      throw new Error('Category name is required.');
    }

    const data = await apiRequest<
      { category?: RawCategoryResponse; data?: RawCategoryResponse } & RawCategoryResponse
    >(`/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: trimmedLabel,
        label: trimmedLabel,
        value: trimmedLabel,
        type: payload.type,
        color: payload.color,
        iconName: payload.iconName,
      }),
    });

    const updated: RawCategoryResponse = data?.category ?? data?.data ?? data;
    return normalizeCategory(updated);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async resetToDefaults(): Promise<CategoryOptionItem[]> {
    return [...DEFAULT_CATEGORY_OPTIONS];
  },
};