/**
 * Medicine box types
 */

/** Medicine box item (drug in user's box) */
export interface MedicineBoxItem {
  id: string;
  drugId: string;
  drugName: string; // Localized
  drugCategory: string;
  addedAt: string; // ISO 8601
}

/** Add item to medicine box request */
export interface AddMedicineBoxItemRequest {
  drugId: string;
}

/** Medicine box summary */
export interface MedicineBoxSummary {
  items: MedicineBoxItem[];
  totalCount: number;
  maxCount: number; // 20
}
