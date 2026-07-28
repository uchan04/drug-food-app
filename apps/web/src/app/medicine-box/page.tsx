'use client';

import { MedicineBoxList } from '@/components/medicine-box/medicine-box-list';

export default function MedicineBoxPage() {
  return (
    <div className="pt-[72px] max-w-[1400px] mx-auto px-6 py-16" data-testid="medicine-box-page">
      <h1 className="text-4xl font-black tracking-tight mb-10">MY BOX</h1>
      <MedicineBoxList />
    </div>
  );
}
