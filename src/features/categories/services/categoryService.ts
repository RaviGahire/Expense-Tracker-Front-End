import { authService } from '../../auth/services/authService';
import {
  DEFAULT_CATEGORY_OPTIONS,
  type CategoryOptionItem,
} from '../components/CategorySelect';
import type { CategoryPayload } from '../components/CategoryManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const STORAGE_KEY = 'pf_categories_v1';

function getAuthHeaders(): HeadersInit {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function readStoredCategories(): CategoryOptionItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_CATEGORY_OPTIONS)
      );
      return [...DEFAULT_CATEGORY_OPTIONS];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_CATEGORY_OPTIONS];
    }

    return parsed as CategoryOptionItem[];
  } catch {
    return [...DEFAULT_CATEGORY_OPTIONS];
  }
}

function writeStoredCategories(categories: CategoryOptionItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // Ignore storage quota errors in restricted browser modes
  }
}

export const categoryService = {
  isRemoteEnabled(): boolean {
    return Boolean(API_BASE_URL);
  },

  async getAll(): Promise<CategoryOptionItem[]> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load categories.');
      }

      return (Array.isArray(data) ? data : data.categories) as CategoryOptionItem[];
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    return readStoredCategories();
  },

  async create(payload: CategoryPayload): Promise<CategoryOptionItem> {
    const trimmedLabel = payload.label.trim();
    if (!trimmedLabel) {
      throw new Error('Category name is required.');
    }

    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...payload,
          label: trimmedLabel,
          value: trimmedLabel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category.');
      }

      return (data.category ?? data) as CategoryOptionItem;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    const current = readStoredCategories();

    const duplicate = current.some(
      (item) =>
        item.type === payload.type &&
        item.label.trim().toLowerCase() === trimmedLabel.toLowerCase()
    );

    if (duplicate) {
      throw new Error(
        `A ${payload.type} category named "${trimmedLabel}" already exists.`
      );
    }

    const created: CategoryOptionItem = {
      id: `cat_custom_${Date.now()}`,
      value: trimmedLabel,
      label: trimmedLabel,
      type: payload.type,
      color: payload.color,
      iconName: payload.iconName,
      isDefault: false,
    };

    const nextList = [created, ...current];
    writeStoredCategories(nextList);
    return created;
  },

  async update(
    id: string,
    payload: CategoryPayload
  ): Promise<CategoryOptionItem> {
    const trimmedLabel = payload.label.trim();
    if (!trimmedLabel) {
      throw new Error('Category name is required.');
    }

    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/api/categories/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...payload,
            label: trimmedLabel,
            value: trimmedLabel,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update category.');
      }

      return (data.category ?? data) as CategoryOptionItem;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    const current = readStoredCategories();
    const target = current.find((item) => item.id === id);

    if (!target) {
      throw new Error('Category not found.');
    }

    const duplicate = current.some(
      (item) =>
        item.id !== id &&
        item.type === payload.type &&
        item.label.trim().toLowerCase() === trimmedLabel.toLowerCase()
    );

    if (duplicate) {
      throw new Error(
        `A ${payload.type} category named "${trimmedLabel}" already exists.`
      );
    }

    const updated: CategoryOptionItem = {
      ...target,
      value: target.isDefault ? target.value : trimmedLabel,
      label: trimmedLabel,
      type: target.isDefault ? target.type : payload.type,
      color: payload.color,
      iconName: payload.iconName,
    };

    const nextList = current.map((item) => (item.id === id ? updated : item));
    writeStoredCategories(nextList);
    return updated;
  },

  async remove(id: string): Promise<void> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/api/categories/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete category.');
      }
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    const current = readStoredCategories();
    const target = current.find((item) => item.id === id);

    if (!target) {
      throw new Error('Category not found.');
    }
    if (target.isDefault) {
      throw new Error('Built-in default categories cannot be deleted.');
    }

    const nextList = current.filter((item) => item.id !== id);
    writeStoredCategories(nextList);
  },

  async resetToDefaults(): Promise<CategoryOptionItem[]> {
    const defaults = [...DEFAULT_CATEGORY_OPTIONS];
    if (!API_BASE_URL) {
      writeStoredCategories(defaults);
    }
    return defaults;
  },
};