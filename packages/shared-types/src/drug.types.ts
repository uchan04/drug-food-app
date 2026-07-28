/**
 * Drug-related types
 */

import type { BaseEntity, Language, PaginationQuery } from './common.types';

/** Drug ingredient */
export interface DrugIngredient {
  id: string;
  nameKo: string;
  nameEn: string;
}

/** Drug search result (list item) */
export interface DrugSearchResult {
  id: string;
  productName: string; // Localized based on request language
  ingredientNames: string[]; // Localized
  category: string;
  hasInteractions: boolean;
}

/** Drug detail (full info) */
export interface DrugDetail extends BaseEntity {
  nameKo: string;
  nameEn: string;
  category: string;
  descriptionKo: string | null;
  descriptionEn: string | null;
  ingredients: DrugIngredient[];
}

/** Drug search query parameters */
export interface DrugSearchQuery extends PaginationQuery {
  q: string;
  lang?: Language;
}

/** Drug autocomplete query */
export interface DrugAutocompleteQuery {
  q: string;
  lang?: Language;
  limit?: number;
}

/** Autocomplete result item */
export interface AutocompleteItem {
  id: string;
  name: string; // Localized
  type: 'product' | 'ingredient';
}
