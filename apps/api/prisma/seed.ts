import { PrismaClient, RiskLevel } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// SEED DATA: Drugs (10 categories, 25+ products)
// ============================================

const DRUGS = [
  // 고혈압약 (ACE 억제제)
  {
    id: 'd001', nameKo: '리시노프릴', nameEn: 'Lisinopril', category: '고혈압약',
    descriptionKo: 'ACE 억제제 계열 고혈압 치료제', descriptionEn: 'ACE inhibitor for hypertension treatment',
    ingredients: [{ id: 'i001', nameKo: '리시노프릴', nameEn: 'Lisinopril' }],
  },
  {
    id: 'd002', nameKo: '에날라프릴', nameEn: 'Enalapril', category: '고혈압약',
    descriptionKo: 'ACE 억제제 계열 고혈압 치료제', descriptionEn: 'ACE inhibitor for hypertension treatment',
    ingredients: [{ id: 'i002', nameKo: '에날라프릴', nameEn: 'Enalapril' }],
  },
  // 고혈압약 (칼슘 채널 차단제)
  {
    id: 'd013', nameKo: '암로디핀', nameEn: 'Amlodipine', category: '고혈압약',
    descriptionKo: '칼슘 채널 차단제 계열 고혈압 치료제', descriptionEn: 'Calcium channel blocker for hypertension',
    ingredients: [{ id: 'i013', nameKo: '암로디핀', nameEn: 'Amlodipine' }],
  },
  // 고지혈증약 (스타틴)
  {
    id: 'd003', nameKo: '리피토', nameEn: 'Lipitor', category: '고지혈증약',
    descriptionKo: '스타틴 계열 고지혈증 치료제', descriptionEn: 'Statin for cholesterol management',
    ingredients: [{ id: 'i003', nameKo: '아토르바스타틴', nameEn: 'Atorvastatin' }],
  },
  {
    id: 'd004', nameKo: '크레스토', nameEn: 'Crestor', category: '고지혈증약',
    descriptionKo: '스타틴 계열 고지혈증 치료제', descriptionEn: 'Statin for cholesterol management',
    ingredients: [{ id: 'i004', nameKo: '로수바스타틴', nameEn: 'Rosuvastatin' }],
  },
  {
    id: 'd014', nameKo: '심바스타틴', nameEn: 'Simvastatin', category: '고지혈증약',
    descriptionKo: '스타틴 계열 고지혈증 치료제', descriptionEn: 'Statin for cholesterol management',
    ingredients: [{ id: 'i014', nameKo: '심바스타틴', nameEn: 'Simvastatin' }],
  },
  // 항생제 (테트라사이클린계)
  {
    id: 'd005', nameKo: '독시사이클린', nameEn: 'Doxycycline', category: '항생제',
    descriptionKo: '테트라사이클린 계열 항생제', descriptionEn: 'Tetracycline-class antibiotic',
    ingredients: [{ id: 'i005', nameKo: '독시사이클린', nameEn: 'Doxycycline' }],
  },
  {
    id: 'd006', nameKo: '미노사이클린', nameEn: 'Minocycline', category: '항생제',
    descriptionKo: '테트라사이클린 계열 항생제', descriptionEn: 'Tetracycline-class antibiotic',
    ingredients: [{ id: 'i006', nameKo: '미노사이클린', nameEn: 'Minocycline' }],
  },
  // 항생제 (퀴놀론계)
  {
    id: 'd015', nameKo: '시프로플록사신', nameEn: 'Ciprofloxacin', category: '항생제',
    descriptionKo: '퀴놀론 계열 항생제', descriptionEn: 'Fluoroquinolone antibiotic',
    ingredients: [{ id: 'i015', nameKo: '시프로플록사신', nameEn: 'Ciprofloxacin' }],
  },
  // 항생제 (페니실린계)
  {
    id: 'd016', nameKo: '아목시실린', nameEn: 'Amoxicillin', category: '항생제',
    descriptionKo: '페니실린 계열 항생제', descriptionEn: 'Penicillin-class antibiotic',
    ingredients: [{ id: 'i016', nameKo: '아목시실린', nameEn: 'Amoxicillin' }],
  },
  // 진통소염제 (NSAIDs)
  {
    id: 'd007', nameKo: '부루펜', nameEn: 'Brufen', category: '진통소염제',
    descriptionKo: '비스테로이드성 소염진통제 (NSAIDs)', descriptionEn: 'Non-steroidal anti-inflammatory drug (NSAID)',
    ingredients: [{ id: 'i007', nameKo: '이부프로펜', nameEn: 'Ibuprofen' }],
  },
  {
    id: 'd008', nameKo: '아스피린', nameEn: 'Aspirin', category: '진통소염제',
    descriptionKo: '비스테로이드성 소염진통제', descriptionEn: 'Non-steroidal anti-inflammatory drug',
    ingredients: [{ id: 'i008', nameKo: '아세틸살리실산', nameEn: 'Acetylsalicylic Acid' }],
  },
  {
    id: 'd009', nameKo: '타이레놀', nameEn: 'Tylenol', category: '진통소염제',
    descriptionKo: '아세트아미노펜 계열 해열진통제', descriptionEn: 'Acetaminophen-based analgesic',
    ingredients: [{ id: 'i009', nameKo: '아세트아미노펜', nameEn: 'Acetaminophen' }],
  },
  {
    id: 'd017', nameKo: '나프록센', nameEn: 'Naproxen', category: '진통소염제',
    descriptionKo: 'NSAIDs 계열 소염진통제', descriptionEn: 'NSAID anti-inflammatory',
    ingredients: [{ id: 'i017', nameKo: '나프록센', nameEn: 'Naproxen' }],
  },
  // 통풍약
  {
    id: 'd010', nameKo: '자일로릭', nameEn: 'Zyloric', category: '통풍약',
    descriptionKo: '요산 생성 억제제', descriptionEn: 'Xanthine oxidase inhibitor for gout',
    ingredients: [{ id: 'i010', nameKo: '알로푸리놀', nameEn: 'Allopurinol' }],
  },
  // 항응고제
  {
    id: 'd011', nameKo: '와파린', nameEn: 'Warfarin', category: '항응고제',
    descriptionKo: '비타민 K 길항제 항응고제', descriptionEn: 'Vitamin K antagonist anticoagulant',
    ingredients: [{ id: 'i011', nameKo: '와파린', nameEn: 'Warfarin' }],
  },
  {
    id: 'd012', nameKo: '쿠마딘', nameEn: 'Coumadin', category: '항응고제',
    descriptionKo: '비타민 K 길항제 항응고제', descriptionEn: 'Vitamin K antagonist anticoagulant',
    ingredients: [{ id: 'i012', nameKo: '와파린 나트륨', nameEn: 'Warfarin Sodium' }],
  },
  // 당뇨약
  {
    id: 'd018', nameKo: '메트포르민', nameEn: 'Metformin', category: '당뇨약',
    descriptionKo: '제2형 당뇨병 치료제 (비구아나이드)', descriptionEn: 'Biguanide for type 2 diabetes',
    ingredients: [{ id: 'i018', nameKo: '메트포르민', nameEn: 'Metformin' }],
  },
  {
    id: 'd019', nameKo: '글리메피리드', nameEn: 'Glimepiride', category: '당뇨약',
    descriptionKo: '설폰요소계 당뇨병 치료제', descriptionEn: 'Sulfonylurea for diabetes',
    ingredients: [{ id: 'i019', nameKo: '글리메피리드', nameEn: 'Glimepiride' }],
  },
  // 항우울제
  {
    id: 'd020', nameKo: '졸로프트', nameEn: 'Zoloft', category: '항우울제',
    descriptionKo: 'SSRI 계열 항우울제', descriptionEn: 'Selective serotonin reuptake inhibitor (SSRI)',
    ingredients: [{ id: 'i020', nameKo: '서트랄린', nameEn: 'Sertraline' }],
  },
  {
    id: 'd021', nameKo: '프로작', nameEn: 'Prozac', category: '항우울제',
    descriptionKo: 'SSRI 계열 항우울제', descriptionEn: 'Selective serotonin reuptake inhibitor (SSRI)',
    ingredients: [{ id: 'i021', nameKo: '플루옥세틴', nameEn: 'Fluoxetine' }],
  },
  // MAO 억제제
  {
    id: 'd022', nameKo: '모클로베마이드', nameEn: 'Moclobemide', category: '항우울제',
    descriptionKo: 'MAO-A 억제제 항우울제', descriptionEn: 'MAO-A inhibitor antidepressant',
    ingredients: [{ id: 'i022', nameKo: '모클로베마이드', nameEn: 'Moclobemide' }],
  },
  // 갑상선약
  {
    id: 'd023', nameKo: '씬지로이드', nameEn: 'Synthroid', category: '갑상선약',
    descriptionKo: '갑상선 호르몬 보충제', descriptionEn: 'Thyroid hormone replacement',
    ingredients: [{ id: 'i023', nameKo: '레보티록신', nameEn: 'Levothyroxine' }],
  },
  // 위장약
  {
    id: 'd024', nameKo: '넥시움', nameEn: 'Nexium', category: '위장약',
    descriptionKo: '프로톤 펌프 억제제 (PPI)', descriptionEn: 'Proton pump inhibitor',
    ingredients: [{ id: 'i024', nameKo: '에소메프라졸', nameEn: 'Esomeprazole' }],
  },
  // 골다공증약
  {
    id: 'd025', nameKo: '포사맥스', nameEn: 'Fosamax', category: '골다공증약',
    descriptionKo: '비스포스포네이트 계열 골다공증 치료제', descriptionEn: 'Bisphosphonate for osteoporosis',
    ingredients: [{ id: 'i025', nameKo: '알렌드로네이트', nameEn: 'Alendronate' }],
  },
  // 항히스타민제
  {
    id: 'd026', nameKo: '지르텍', nameEn: 'Zyrtec', category: '항히스타민제',
    descriptionKo: '2세대 항히스타민제', descriptionEn: 'Second-generation antihistamine',
    ingredients: [{ id: 'i026', nameKo: '세티리진', nameEn: 'Cetirizine' }],
  },
];

// ============================================
// SEED DATA: Foods (8 categories, 30+ items)
// ============================================

const FOODS = [
  // 과일
  { id: 'f001', nameKo: '바나나', nameEn: 'Banana', category: '과일', nutrients: ['칼륨', '비타민B6'] },
  { id: 'f002', nameKo: '자몽', nameEn: 'Grapefruit', category: '과일', nutrients: ['비타민C', '푸라노쿠마린'] },
  { id: 'f003', nameKo: '오렌지', nameEn: 'Orange', category: '과일', nutrients: ['칼륨', '비타민C'] },
  { id: 'f017', nameKo: '아보카도', nameEn: 'Avocado', category: '과일', nutrients: ['칼륨', '비타민E', '지방'] },
  { id: 'f018', nameKo: '크랜베리', nameEn: 'Cranberry', category: '과일', nutrients: ['비타민C', '살리실산'] },
  { id: 'f019', nameKo: '망고', nameEn: 'Mango', category: '과일', nutrients: ['비타민A', '비타민C'] },
  // 유제품
  { id: 'f004', nameKo: '우유', nameEn: 'Milk', category: '유제품', nutrients: ['칼슘', '단백질'] },
  { id: 'f005', nameKo: '치즈', nameEn: 'Cheese', category: '유제품', nutrients: ['칼슘', '나트륨', '티라민'] },
  { id: 'f006', nameKo: '요거트', nameEn: 'Yogurt', category: '유제품', nutrients: ['칼슘', '프로바이오틱스'] },
  // 채소
  { id: 'f007', nameKo: '시금치', nameEn: 'Spinach', category: '채소', nutrients: ['비타민K', '철분', '옥살산'] },
  { id: 'f008', nameKo: '케일', nameEn: 'Kale', category: '채소', nutrients: ['비타민K', '칼슘'] },
  { id: 'f009', nameKo: '브로콜리', nameEn: 'Broccoli', category: '채소', nutrients: ['비타민K', '비타민C'] },
  { id: 'f020', nameKo: '양배추', nameEn: 'Cabbage', category: '채소', nutrients: ['비타민K', '식이섬유'] },
  { id: 'f021', nameKo: '마늘', nameEn: 'Garlic', category: '채소', nutrients: ['알리신', '비타민C'] },
  { id: 'f022', nameKo: '생강', nameEn: 'Ginger', category: '채소', nutrients: ['진저롤', '비타민C'] },
  { id: 'f023', nameKo: '고구마', nameEn: 'Sweet Potato', category: '채소', nutrients: ['칼륨', '식이섬유', '비타민A'] },
  // 음료
  // 알코올 (맥주) 였다. 남은 행이 '맥주에 포함된 푸린이 요산 수치를 상승'이라
  // 에탄올이 아니라 맥주 고유의 기전이다. 이름을 그에 맞게 바꿨다.
  { id: 'f010', nameKo: '맥주', nameEn: 'Beer', category: '음료', nutrients: ['에탄올', '푸린'] },
  { id: 'f012', nameKo: '커피', nameEn: 'Coffee', category: '음료', nutrients: ['카페인'] },
  { id: 'f024', nameKo: '녹차', nameEn: 'Green Tea', category: '음료', nutrients: ['카페인', '비타민K', '카테킨'] },
  { id: 'f026', nameKo: '에너지드링크', nameEn: 'Energy Drink', category: '음료', nutrients: ['카페인', '타우린', '당류'] },
  // 기타/간식
  { id: 'f014', nameKo: '콩가루', nameEn: 'Soybean Powder', category: '기타', nutrients: ['비타민K', '단백질'] },
  { id: 'f015', nameKo: '고푸린 음식', nameEn: 'High-Purine Foods', category: '기타', nutrients: ['푸린'] },
  { id: 'f016', nameKo: '제산제', nameEn: 'Antacid', category: '기타', nutrients: ['마그네슘', '알루미늄'] },
  { id: 'f028', nameKo: '다크초콜릿', nameEn: 'Dark Chocolate', category: '간식', nutrients: ['카페인', '테오브로민', '티라민'] },
  { id: 'f029', nameKo: '김치', nameEn: 'Kimchi', category: '발효식품', nutrients: ['비타민K', '나트륨', '티라민'] },
  { id: 'f030', nameKo: '된장', nameEn: 'Doenjang', category: '발효식품', nutrients: ['나트륨', '티라민', '이소플라본'] },
  { id: 'f031', nameKo: '청국장', nameEn: 'Cheonggukjang', category: '발효식품', nutrients: ['비타민K2', '티라민', '나토키나제'] },
  { id: 'f032', nameKo: '두부', nameEn: 'Tofu', category: '기타', nutrients: ['칼슘', '이소플라본', '단백질'] },
  { id: 'f033', nameKo: '견과류 (호두)', nameEn: 'Walnuts', category: '기타', nutrients: ['오메가3', '비타민E'] },
  { id: 'f035', nameKo: '고나트륨 음식', nameEn: 'High-Sodium Foods', category: '기타', nutrients: ['나트륨'] },
  { id: 'f036', nameKo: '고섬유 식품', nameEn: 'High-Fiber Foods', category: '기타', nutrients: ['식이섬유'] },
  // 아래는 추출 파이프라인이 쓰는 음식이다. seed 가 Food 어휘의 주인이어야
  // 손으로 적은 행이 이 음식들을 참조할 수 있다 (알로푸리놀 x 알코올 등).
  // 여기에 없으면 load-interactions 가 nameKo 로 찾다 실패해 새로 만드는데,
  // seed 가 먼저 돌므로 seed 행은 그 id 를 가리킬 수 없다.
  { id: 'f037', nameKo: '알코올', nameEn: 'Alcohol', category: '음료', nutrients: ['에탄올'] },
  { id: 'f038', nameKo: '음식(일반)', nameEn: 'Food (general)', category: '기타', nutrients: [] },
  { id: 'f039', nameKo: '칼슘', nameEn: 'Calcium', category: '보충제', nutrients: ['칼슘'] },
  { id: 'f040', nameKo: '마그네슘', nameEn: 'Magnesium', category: '보충제', nutrients: ['마그네슘'] },
  { id: 'f041', nameKo: '알루미늄', nameEn: 'Aluminium', category: '보충제', nutrients: ['알루미늄'] },
  { id: 'f042', nameKo: '아연', nameEn: 'Zinc', category: '보충제', nutrients: ['아연'] },
  { id: 'f043', nameKo: '철분', nameEn: 'Iron', category: '보충제', nutrients: ['철분'] },
  { id: 'f044', nameKo: '지방', nameEn: 'Dietary Fat', category: '기타', nutrients: ['지방'] },
  { id: 'f045', nameKo: '야채', nameEn: 'Vegetables', category: '채소', nutrients: ['비타민K', '식이섬유'] },
  { id: 'f046', nameKo: '세인트존스워트', nameEn: "St. John's Wort", category: '건강기능식품', nutrients: ['하이퍼리신'] },
];

// 중복이라 은퇴시킨 Food. 알코올을 종류별로(소주/맥주/와인) 쪼개고 자몽과
// 자몽주스를 분리한 것이 같은 상호작용을 여러 행으로 적재하는 원인이었다
// (아세트아미노펜을 조회하면 알코올 항목이 위험도가 서로 다른 채로 4개 나왔다).
//
// seed 는 upsert 만 하므로 배열에서 지워도 기존 DB 의 행은 남는다. 명시적으로
// 삭제한다. Interaction.foodId 가 onDelete: Cascade 라 딸린 행도 함께 지워진다.
const RETIRED_FOODS = [
  { id: 'f011', nameKo: '알코올 (와인)' },
  { id: 'f013', nameKo: '자몽주스' },
  { id: 'f025', nameKo: '소주' },
  { id: 'f027', nameKo: '우유 (저지방)' },
  { id: 'f034', nameKo: '철분보충제' },
];

// ============================================
// SEED DATA: Interactions (손으로 적은 행. 출처가 없다)
// ============================================

const INTERACTIONS = [
  // === 고혈압약 (ACE 억제제) + 칼륨 식품 ===
  {
    ingredientId: 'i001', foodId: 'f001', riskLevel: RiskLevel.warning,
    reasonKo: 'ACE 억제제가 칼륨 배출을 억제하는데, 바나나의 높은 칼륨이 고칼륨혈증 위험을 증가시킵니다.',
    reasonEn: 'ACE inhibitors reduce potassium excretion, and high potassium in bananas increases hyperkalemia risk.',
    sideEffectsKo: '고칼륨혈증으로 인한 근육 약화, 심장 부정맥, 메스꺼움',
    sideEffectsEn: 'Muscle weakness, cardiac arrhythmia, nausea from hyperkalemia',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i001', foodId: 'f002', riskLevel: RiskLevel.warning,
    reasonKo: '자몽이 약물 대사를 방해하고 칼륨 수치를 높일 수 있습니다.',
    reasonEn: 'Grapefruit may interfere with drug metabolism and elevate potassium levels.',
    sideEffectsKo: '약물 혈중 농도 변화, 고칼륨혈증 위험',
    sideEffectsEn: 'Changes in drug blood levels, hyperkalemia risk',
    timeGapHours: null,
  },
  {
    ingredientId: 'i001', foodId: 'f003', riskLevel: RiskLevel.caution,
    reasonKo: '오렌지에 포함된 칼륨이 ACE 억제제와 상호작용할 수 있습니다.',
    reasonEn: 'Potassium in oranges may interact with ACE inhibitors.',
    sideEffectsKo: '경미한 칼륨 수치 상승',
    sideEffectsEn: 'Mild elevation of potassium levels',
    timeGapHours: null,
  },
  {
    ingredientId: 'i001', foodId: 'f017', riskLevel: RiskLevel.warning,
    reasonKo: '아보카도는 칼륨이 매우 높아 ACE 억제제 복용 시 고칼륨혈증 위험이 있습니다.',
    reasonEn: 'Avocados are very high in potassium, increasing hyperkalemia risk with ACE inhibitors.',
    sideEffectsKo: '고칼륨혈증, 심박 이상',
    sideEffectsEn: 'Hyperkalemia, cardiac irregularities',
    timeGapHours: null,
  },
  {
    ingredientId: 'i001', foodId: 'f023', riskLevel: RiskLevel.caution,
    reasonKo: '고구마의 칼륨이 ACE 억제제와 함께 칼륨 수치를 높일 수 있습니다.',
    reasonEn: 'Potassium in sweet potatoes may elevate levels when combined with ACE inhibitors.',
    sideEffectsKo: '칼륨 수치 상승 가능',
    sideEffectsEn: 'Possible potassium level increase',
    timeGapHours: null,
  },
  // === 칼슘 채널 차단제 + 자몽 ===
  {
    ingredientId: 'i013', foodId: 'f002', riskLevel: RiskLevel.contraindicated,
    reasonKo: '자몽이 CYP3A4 효소를 억제하여 암로디핀 혈중 농도를 위험 수준으로 상승시킵니다.',
    reasonEn: 'Grapefruit inhibits CYP3A4, raising amlodipine levels to dangerous concentrations.',
    sideEffectsKo: '심한 저혈압, 어지러움, 심박수 증가, 두통',
    sideEffectsEn: 'Severe hypotension, dizziness, tachycardia, headache',
    timeGapHours: null,
  },
  // === 고지혈증약 + 자몽/알코올 ===
  {
    ingredientId: 'i003', foodId: 'f002', riskLevel: RiskLevel.contraindicated,
    reasonKo: '자몽의 푸라노쿠마린이 CYP3A4 효소를 억제하여 약물 농도가 위험 수준으로 상승합니다.',
    reasonEn: 'Furanocoumarins in grapefruit inhibit CYP3A4 enzyme, causing dangerous drug level elevation.',
    sideEffectsKo: '횡문근융해증, 근육통, 간 손상, 신장 손상',
    sideEffectsEn: 'Rhabdomyolysis, muscle pain, liver damage, kidney damage',
    timeGapHours: null,
  },
  {
    ingredientId: 'i004', foodId: 'f002', riskLevel: RiskLevel.warning,
    reasonKo: '로수바스타틴은 아토르바스타틴보다 자몽 영향이 적지만 주의가 필요합니다.',
    reasonEn: 'Rosuvastatin is less affected by grapefruit than atorvastatin but caution is advised.',
    sideEffectsKo: '약물 농도 상승 가능, 근육통',
    sideEffectsEn: 'Possible drug level increase, muscle pain',
    timeGapHours: null,
  },
  {
    ingredientId: 'i014', foodId: 'f002', riskLevel: RiskLevel.contraindicated,
    reasonKo: '심바스타틴은 CYP3A4에 크게 의존하므로 자몽과 병용 시 매우 위험합니다.',
    reasonEn: 'Simvastatin heavily relies on CYP3A4; grapefruit co-consumption is very dangerous.',
    sideEffectsKo: '횡문근융해증, 급성 신부전',
    sideEffectsEn: 'Rhabdomyolysis, acute renal failure',
    timeGapHours: null,
  },
  // === 항생제 (테트라사이클린) + 유제품/제산제 ===
  {
    ingredientId: 'i005', foodId: 'f004', riskLevel: RiskLevel.warning,
    reasonKo: '우유의 칼슘이 독시사이클린과 결합하여 약물 흡수를 크게 방해합니다.',
    reasonEn: 'Calcium in milk binds with doxycycline, significantly reducing drug absorption.',
    sideEffectsKo: '항생 효과 감소, 감염 치료 실패 가능',
    sideEffectsEn: 'Reduced antibiotic efficacy, possible treatment failure',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i005', foodId: 'f005', riskLevel: RiskLevel.warning,
    reasonKo: '치즈의 칼슘이 독시사이클린과 킬레이트를 형성하여 흡수를 방해합니다.',
    reasonEn: 'Calcium in cheese forms chelates with doxycycline, reducing absorption.',
    sideEffectsKo: '약효 감소',
    sideEffectsEn: 'Reduced drug efficacy',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i005', foodId: 'f006', riskLevel: RiskLevel.warning,
    reasonKo: '요거트의 칼슘이 독시사이클린 흡수를 방해합니다.',
    reasonEn: 'Calcium in yogurt interferes with doxycycline absorption.',
    sideEffectsKo: '약효 감소',
    sideEffectsEn: 'Reduced drug efficacy',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i005', foodId: 'f016', riskLevel: RiskLevel.warning,
    reasonKo: '제산제의 마그네슘/알루미늄이 약물과 결합하여 흡수를 방해합니다.',
    reasonEn: 'Magnesium/aluminum in antacids bind with the drug, reducing absorption.',
    sideEffectsKo: '약효 흡수 방해, 치료 효과 감소',
    sideEffectsEn: 'Impaired drug absorption, reduced treatment efficacy',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i005', foodId: 'f043', riskLevel: RiskLevel.warning,
    reasonKo: '철분이 독시사이클린과 킬레이트를 형성하여 양쪽 모두 흡수를 방해합니다.',
    reasonEn: 'Iron forms chelates with doxycycline, impairing absorption of both.',
    sideEffectsKo: '항생제 및 철분 흡수 감소',
    sideEffectsEn: 'Reduced absorption of both antibiotic and iron',
    timeGapHours: 3,
  },
  {
    ingredientId: 'i006', foodId: 'f004', riskLevel: RiskLevel.warning,
    reasonKo: '미노사이클린도 칼슘과 결합하여 흡수가 감소합니다.',
    reasonEn: 'Minocycline also binds with calcium, reducing absorption.',
    sideEffectsKo: '약효 감소',
    sideEffectsEn: 'Reduced drug efficacy',
    timeGapHours: 2,
  },
  // === 퀴놀론 항생제 + 유제품/카페인 ===
  {
    ingredientId: 'i015', foodId: 'f004', riskLevel: RiskLevel.warning,
    reasonKo: '우유의 칼슘이 시프로플록사신과 킬레이트를 형성하여 흡수율을 50% 이상 감소시킵니다.',
    reasonEn: 'Calcium in milk chelates with ciprofloxacin, reducing absorption by over 50%.',
    sideEffectsKo: '항생 효과 현저히 감소, 감염 지속',
    sideEffectsEn: 'Significantly reduced antibiotic effect, persistent infection',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i015', foodId: 'f012', riskLevel: RiskLevel.warning,
    reasonKo: '시프로플록사신이 카페인 대사를 억제하여 카페인 효과가 과도해질 수 있습니다.',
    reasonEn: 'Ciprofloxacin inhibits caffeine metabolism, potentially causing excessive caffeine effects.',
    sideEffectsKo: '불면, 심계항진, 불안, 두통',
    sideEffectsEn: 'Insomnia, palpitations, anxiety, headache',
    timeGapHours: null,
  },
  {
    ingredientId: 'i015', foodId: 'f026', riskLevel: RiskLevel.warning,
    reasonKo: '에너지드링크의 높은 카페인이 시프로플록사신과 병용 시 독성 수준으로 축적됩니다.',
    reasonEn: 'High caffeine in energy drinks accumulates to toxic levels when combined with ciprofloxacin.',
    sideEffectsKo: '심박 이상, 발작 위험, 심한 불안',
    sideEffectsEn: 'Cardiac arrhythmia, seizure risk, severe anxiety',
    timeGapHours: null,
  },
  {
    ingredientId: 'i015', foodId: 'f016', riskLevel: RiskLevel.warning,
    reasonKo: '제산제가 시프로플록사신 흡수를 크게 방해합니다.',
    reasonEn: 'Antacids significantly reduce ciprofloxacin absorption.',
    sideEffectsKo: '약효 50~90% 감소',
    sideEffectsEn: '50-90% reduction in drug efficacy',
    timeGapHours: 2,
  },
  // === 진통소염제 + 알코올/커피 ===
  {
    ingredientId: 'i007', foodId: 'f012', riskLevel: RiskLevel.caution,
    reasonKo: '커피의 카페인이 위산 분비를 촉진하여 이부프로펜의 위장 자극을 증가시킬 수 있습니다.',
    reasonEn: 'Caffeine in coffee promotes gastric acid secretion, potentially increasing ibuprofen GI irritation.',
    sideEffectsKo: '속쓰림, 위장 불편감 증가',
    sideEffectsEn: 'Heartburn, increased GI discomfort',
    timeGapHours: 1,
  },
  // === 아세트아미노펜 + 알코올 ===
  {
    ingredientId: 'i009', foodId: 'f012', riskLevel: RiskLevel.caution,
    reasonKo: '카페인이 아세트아미노펜 흡수를 촉진할 수 있으나, 과량 시 간 부담 증가.',
    reasonEn: 'Caffeine may enhance acetaminophen absorption, but excessive amounts increase liver burden.',
    sideEffectsKo: '간 부담 증가 가능',
    sideEffectsEn: 'Possible increased liver burden',
    timeGapHours: null,
  },
  // === 통풍약 + 맥주/고푸린 ===
  {
    ingredientId: 'i010', foodId: 'f010', riskLevel: RiskLevel.warning,
    reasonKo: '맥주에 포함된 푸린이 요산 수치를 상승시켜 알로푸리놀의 약효를 감소시킵니다.',
    reasonEn: 'Purines in beer raise uric acid levels, reducing allopurinol efficacy.',
    sideEffectsKo: '통풍 발작 유발, 약효 감소',
    sideEffectsEn: 'Gout flare-up, reduced drug efficacy',
    timeGapHours: null,
  },
  {
    ingredientId: 'i010', foodId: 'f015', riskLevel: RiskLevel.caution,
    reasonKo: '고푸린 음식이 요산 생성을 증가시켜 통풍약의 효과를 떨어뜨릴 수 있습니다.',
    reasonEn: 'High-purine foods increase uric acid production, potentially reducing gout medication efficacy.',
    sideEffectsKo: '약효 감소, 통풍 증상 악화 가능',
    sideEffectsEn: 'Reduced efficacy, possible worsening of gout symptoms',
    timeGapHours: null,
  },
  {
    ingredientId: 'i010', foodId: 'f037', riskLevel: RiskLevel.warning,
    reasonKo: '소주 등 주류가 요산 배출을 억제하여 통풍약 효과를 감소시킵니다.',
    reasonEn: 'Alcohol inhibits uric acid excretion, reducing gout medication effectiveness.',
    sideEffectsKo: '통풍 발작 위험 증가',
    sideEffectsEn: 'Increased gout flare-up risk',
    timeGapHours: null,
  },
  // === 항응고제 + 비타민K 식품/발효식품 ===
  {
    ingredientId: 'i011', foodId: 'f007', riskLevel: RiskLevel.contraindicated,
    reasonKo: '시금치의 비타민 K가 와파린의 항응고 작용을 직접적으로 길항합니다.',
    reasonEn: 'Vitamin K in spinach directly antagonizes warfarin anticoagulant action.',
    sideEffectsKo: '혈전 형성 위험 증가, 뇌졸중/심근경색 위험',
    sideEffectsEn: 'Increased thrombosis risk, stroke/MI risk',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f008', riskLevel: RiskLevel.contraindicated,
    reasonKo: '케일은 비타민 K 함량이 매우 높아 와파린 효과를 크게 감소시킵니다.',
    reasonEn: 'Kale has very high vitamin K content, significantly reducing warfarin effect.',
    sideEffectsKo: '약효 저하, 혈전 위험',
    sideEffectsEn: 'Reduced efficacy, thrombosis risk',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f009', riskLevel: RiskLevel.warning,
    reasonKo: '브로콜리의 비타민 K가 와파린과 상호작용할 수 있습니다.',
    reasonEn: 'Vitamin K in broccoli may interact with warfarin.',
    sideEffectsKo: '약효 변동 가능',
    sideEffectsEn: 'Possible efficacy fluctuation',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f014', riskLevel: RiskLevel.warning,
    reasonKo: '콩가루에 포함된 비타민 K가 와파린의 효과를 부분적으로 감소시킬 수 있습니다.',
    reasonEn: 'Vitamin K in soybean powder may partially reduce warfarin effectiveness.',
    sideEffectsKo: '약효 부분 감소',
    sideEffectsEn: 'Partial reduction in drug efficacy',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f020', riskLevel: RiskLevel.warning,
    reasonKo: '양배추의 비타민 K가 와파린 효과를 감소시킬 수 있습니다.',
    reasonEn: 'Vitamin K in cabbage may reduce warfarin effectiveness.',
    sideEffectsKo: '항응고 효과 감소',
    sideEffectsEn: 'Reduced anticoagulant effect',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f024', riskLevel: RiskLevel.warning,
    reasonKo: '녹차에 비타민 K가 함유되어 있어 와파린 효과를 방해할 수 있습니다.',
    reasonEn: 'Green tea contains vitamin K which may interfere with warfarin.',
    sideEffectsKo: '항응고 효과 감소',
    sideEffectsEn: 'Reduced anticoagulant effect',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f029', riskLevel: RiskLevel.warning,
    reasonKo: '김치에 비타민 K가 포함되어 와파린 약효에 영향을 줄 수 있습니다.',
    reasonEn: 'Kimchi contains vitamin K which may affect warfarin efficacy.',
    sideEffectsKo: '약효 변동',
    sideEffectsEn: 'Efficacy fluctuation',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f031', riskLevel: RiskLevel.contraindicated,
    reasonKo: '청국장의 비타민 K2와 나토키나제가 와파린 효과를 크게 변화시킵니다.',
    reasonEn: 'Vitamin K2 and nattokinase in cheonggukjang significantly alter warfarin effect.',
    sideEffectsKo: '출혈 위험 또는 혈전 위험 (예측 불가)',
    sideEffectsEn: 'Bleeding risk or thrombosis risk (unpredictable)',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f021', riskLevel: RiskLevel.caution,
    reasonKo: '마늘이 와파린의 항응고 효과를 증강시켜 출혈 위험을 높일 수 있습니다.',
    reasonEn: 'Garlic may enhance warfarin anticoagulant effect, increasing bleeding risk.',
    sideEffectsKo: '출혈 위험 증가',
    sideEffectsEn: 'Increased bleeding risk',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f022', riskLevel: RiskLevel.caution,
    reasonKo: '생강이 항응고 효과를 증강시킬 수 있습니다.',
    reasonEn: 'Ginger may enhance anticoagulant effect.',
    sideEffectsKo: '출혈 경향 증가',
    sideEffectsEn: 'Increased bleeding tendency',
    timeGapHours: null,
  },
  {
    ingredientId: 'i011', foodId: 'f018', riskLevel: RiskLevel.warning,
    reasonKo: '크랜베리가 와파린 대사를 방해하여 출혈 위험을 증가시킵니다.',
    reasonEn: 'Cranberry interferes with warfarin metabolism, increasing bleeding risk.',
    sideEffectsKo: '출혈 위험 증가, INR 상승',
    sideEffectsEn: 'Increased bleeding risk, elevated INR',
    timeGapHours: null,
  },
  {
    ingredientId: 'i012', foodId: 'f007', riskLevel: RiskLevel.contraindicated,
    reasonKo: '와파린 나트륨도 비타민 K에 의해 길항됩니다.',
    reasonEn: 'Warfarin sodium is also antagonized by vitamin K.',
    sideEffectsKo: '혈전 형성 위험 증가',
    sideEffectsEn: 'Increased thrombosis risk',
    timeGapHours: null,
  },
  // === 당뇨약 + 알코올 ===
  {
    ingredientId: 'i018', foodId: 'f036', riskLevel: RiskLevel.caution,
    reasonKo: '고섬유 식품이 메트포르민 흡수를 감소시킬 수 있습니다.',
    reasonEn: 'High-fiber foods may reduce metformin absorption.',
    sideEffectsKo: '약효 감소 가능',
    sideEffectsEn: 'Possible reduced efficacy',
    timeGapHours: 1,
  },
  // === 항우울제 (SSRI) + 알코올/카페인 ===
  {
    ingredientId: 'i020', foodId: 'f012', riskLevel: RiskLevel.caution,
    reasonKo: '카페인과 SSRI 병용 시 불안, 초조감이 증가할 수 있습니다.',
    reasonEn: 'Caffeine combined with SSRI may increase anxiety and restlessness.',
    sideEffectsKo: '불안, 초조, 불면',
    sideEffectsEn: 'Anxiety, restlessness, insomnia',
    timeGapHours: null,
  },
  // === MAO 억제제 + 티라민 식품 ===
  {
    ingredientId: 'i022', foodId: 'f005', riskLevel: RiskLevel.contraindicated,
    reasonKo: 'MAO 억제제 복용 중 치즈의 티라민이 고혈압 위기를 유발할 수 있습니다.',
    reasonEn: 'Tyramine in cheese can cause hypertensive crisis during MAO inhibitor use.',
    sideEffectsKo: '고혈압 위기, 심한 두통, 뇌출혈 위험',
    sideEffectsEn: 'Hypertensive crisis, severe headache, cerebral hemorrhage risk',
    timeGapHours: null,
  },
  {
    ingredientId: 'i022', foodId: 'f029', riskLevel: RiskLevel.contraindicated,
    reasonKo: '김치의 티라민이 MAO 억제제와 함께 고혈압 위기를 유발합니다.',
    reasonEn: 'Tyramine in kimchi causes hypertensive crisis with MAO inhibitors.',
    sideEffectsKo: '고혈압 위기, 두통, 구역질',
    sideEffectsEn: 'Hypertensive crisis, headache, nausea',
    timeGapHours: null,
  },
  {
    ingredientId: 'i022', foodId: 'f030', riskLevel: RiskLevel.contraindicated,
    reasonKo: '된장의 높은 티라민 함량이 MAO 억제제와 치명적 상호작용을 합니다.',
    reasonEn: 'High tyramine in doenjang has lethal interaction with MAO inhibitors.',
    sideEffectsKo: '고혈압 위기, 심혈관 응급',
    sideEffectsEn: 'Hypertensive crisis, cardiovascular emergency',
    timeGapHours: null,
  },
  {
    ingredientId: 'i022', foodId: 'f031', riskLevel: RiskLevel.contraindicated,
    reasonKo: '청국장은 티라민이 매우 높아 MAO 억제제와 절대 병용 금기입니다.',
    reasonEn: 'Cheonggukjang has very high tyramine; absolutely contraindicated with MAO inhibitors.',
    sideEffectsKo: '고혈압 위기, 뇌졸중 위험',
    sideEffectsEn: 'Hypertensive crisis, stroke risk',
    timeGapHours: null,
  },
  {
    ingredientId: 'i022', foodId: 'f028', riskLevel: RiskLevel.warning,
    reasonKo: '다크초콜릿의 티라민과 카페인이 MAO 억제제와 상호작용합니다.',
    reasonEn: 'Tyramine and caffeine in dark chocolate interact with MAO inhibitors.',
    sideEffectsKo: '혈압 상승, 두통',
    sideEffectsEn: 'Blood pressure increase, headache',
    timeGapHours: null,
  },
  // === 갑상선약 + 칼슘/철분/콩/커피 ===
  {
    ingredientId: 'i023', foodId: 'f004', riskLevel: RiskLevel.warning,
    reasonKo: '우유의 칼슘이 레보티록신 흡수를 방해합니다. 복용 후 4시간 간격 필요.',
    reasonEn: 'Calcium in milk impairs levothyroxine absorption. 4-hour gap needed.',
    sideEffectsKo: '갑상선 호르몬 흡수 감소, 치료 효과 저하',
    sideEffectsEn: 'Reduced thyroid hormone absorption, decreased treatment effect',
    timeGapHours: 4,
  },
  {
    ingredientId: 'i023', foodId: 'f012', riskLevel: RiskLevel.caution,
    reasonKo: '커피가 레보티록신 흡수를 30% 가량 감소시킬 수 있습니다.',
    reasonEn: 'Coffee may reduce levothyroxine absorption by about 30%.',
    sideEffectsKo: '약효 감소',
    sideEffectsEn: 'Reduced efficacy',
    timeGapHours: 1,
  },
  {
    ingredientId: 'i023', foodId: 'f032', riskLevel: RiskLevel.warning,
    reasonKo: '두부/콩의 이소플라본이 레보티록신 흡수를 방해합니다.',
    reasonEn: 'Isoflavones in tofu/soy interfere with levothyroxine absorption.',
    sideEffectsKo: '갑상선 호르몬 효과 감소',
    sideEffectsEn: 'Reduced thyroid hormone effect',
    timeGapHours: 4,
  },
  {
    ingredientId: 'i023', foodId: 'f036', riskLevel: RiskLevel.caution,
    reasonKo: '고섬유 식품이 레보티록신 흡수를 방해할 수 있습니다.',
    reasonEn: 'High-fiber foods may impair levothyroxine absorption.',
    sideEffectsKo: '약효 감소 가능',
    sideEffectsEn: 'Possible reduced efficacy',
    timeGapHours: 2,
  },
  // === 골다공증약 + 유제품/커피/오렌지주스 ===
  {
    ingredientId: 'i025', foodId: 'f004', riskLevel: RiskLevel.contraindicated,
    reasonKo: '알렌드로네이트는 반드시 공복에 물로만 복용해야 합니다. 우유가 흡수를 완전히 차단합니다.',
    reasonEn: 'Alendronate must be taken on empty stomach with water only. Milk completely blocks absorption.',
    sideEffectsKo: '약효 완전 소실',
    sideEffectsEn: 'Complete loss of drug effect',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i025', foodId: 'f012', riskLevel: RiskLevel.warning,
    reasonKo: '커피가 알렌드로네이트 흡수를 방해하고 식도 자극을 악화시킵니다.',
    reasonEn: 'Coffee impairs alendronate absorption and worsens esophageal irritation.',
    sideEffectsKo: '약효 감소, 식도 자극',
    sideEffectsEn: 'Reduced efficacy, esophageal irritation',
    timeGapHours: 2,
  },
  {
    ingredientId: 'i025', foodId: 'f003', riskLevel: RiskLevel.warning,
    reasonKo: '오렌지주스의 산성이 알렌드로네이트와 상호작용하여 식도 손상을 악화시킵니다.',
    reasonEn: 'Acidity in orange juice interacts with alendronate, worsening esophageal damage.',
    sideEffectsKo: '식도 궤양, 위장 불편',
    sideEffectsEn: 'Esophageal ulcers, GI discomfort',
    timeGapHours: 2,
  },
  // === 항히스타민제 + 알코올/자몽 ===
  {
    ingredientId: 'i026', foodId: 'f002', riskLevel: RiskLevel.caution,
    reasonKo: '자몽이 세티리진의 대사를 방해하여 체내 약물 농도를 높일 수 있습니다.',
    reasonEn: 'Grapefruit may impair cetirizine metabolism, increasing drug levels.',
    sideEffectsKo: '졸음 증가, 구강 건조',
    sideEffectsEn: 'Increased drowsiness, dry mouth',
    timeGapHours: null,
  },
  // === 위장약 (PPI) + 고지방/알코올 ===
  {
    ingredientId: 'i024', foodId: 'f012', riskLevel: RiskLevel.caution,
    reasonKo: '커피가 위산 분비를 촉진하여 PPI의 효과를 감소시킬 수 있습니다.',
    reasonEn: 'Coffee promotes acid secretion, potentially reducing PPI effectiveness.',
    sideEffectsKo: '속쓰림 지속, 약효 감소',
    sideEffectsEn: 'Persistent heartburn, reduced efficacy',
    timeGapHours: null,
  },
  {
    ingredientId: 'i024', foodId: 'f037', riskLevel: RiskLevel.caution,
    reasonKo: '알코올이 위산 분비를 증가시켜 PPI의 치료 효과를 방해합니다.',
    reasonEn: 'Alcohol increases acid secretion, counteracting PPI therapeutic effect.',
    sideEffectsKo: '위산 역류 악화',
    sideEffectsEn: 'Worsened acid reflux',
    timeGapHours: null,
  },
];

// ============================================
// MAIN SEED FUNCTION (Idempotent via upsert)
// ============================================

async function main() {
  console.info('🌱 Seeding database...');

  // Food.nameKo 가 유니크(마이그레이션 0005)다. 배열에서 이름이 겹치면
  // upsert 가 제약 위반으로 터지는데, 어느 행 때문인지 알기 어렵다.
  const dupNames = FOODS.map((f) => f.nameKo).filter((n, i, a) => a.indexOf(n) !== i);
  if (dupNames.length > 0) {
    throw new Error(`FOODS 에 이름이 겹치는 항목: ${[...new Set(dupNames)].join(', ')}`);
  }

  // 은퇴시킨 이름을 다시 넣으면 중복 모델로 되돌아간다.
  const revived = FOODS.filter((f) => RETIRED_FOODS.some((r) => r.nameKo === f.nameKo));
  if (revived.length > 0) {
    throw new Error(
      `은퇴한 Food 이름을 다시 넣었다: ${revived.map((f) => f.nameKo).join(', ')}. ` +
        '알코올/자몽으로 묶기로 한 것들이다 (pipeline/normalize.FOOD_ALIAS 참조).',
    );
  }

  // 재지정한 foodId 가 FOODS 에 없으면 upsert 가 외래키에서 터진다. 어느 행이
  // 문제인지 알 수 없는 에러가 나오므로 먼저 확인한다.
  const foodIds = new Set(FOODS.map((f) => f.id));
  const dangling = INTERACTIONS.filter((i) => !foodIds.has(i.foodId));
  if (dangling.length > 0) {
    throw new Error(
      `FOODS 에 없는 foodId 를 가리키는 상호작용 ${dangling.length}건: ` +
        dangling.map((i) => `${i.ingredientId}->${i.foodId}`).join(', '),
    );
  }
  const retiredStillUsed = INTERACTIONS.filter((i) =>
    RETIRED_FOODS.some((r) => r.id === i.foodId),
  );
  if (retiredStillUsed.length > 0) {
    throw new Error(
      `은퇴한 Food 를 가리키는 상호작용 ${retiredStillUsed.length}건: ` +
        retiredStillUsed.map((i) => `${i.ingredientId}->${i.foodId}`).join(', '),
    );
  }

  // 은퇴한 Food 삭제. seed 는 upsert 만 하므로 배열에서 지운 행이 기존 DB 에
  // 그대로 남는다. Interaction 은 Cascade 로 함께 지워진다.
  const retired = await prisma.food.deleteMany({
    where: { id: { in: RETIRED_FOODS.map((f) => f.id) } },
  });
  if (retired.count > 0) {
    console.info(`🧹 은퇴한 Food ${retired.count}개 삭제 (딸린 상호작용 포함)`);
  }

  // Seed Foods
  for (const food of FOODS) {
    await prisma.food.upsert({
      where: { id: food.id },
      update: {
        nameKo: food.nameKo,
        nameEn: food.nameEn,
        category: food.category,
        nutrients: food.nutrients,
      },
      create: food,
    });
  }
  console.info(`✅ Seeded ${FOODS.length} foods`);

  // Seed Drugs with Ingredients
  for (const drug of DRUGS) {
    const { ingredients, ...drugData } = drug;

    await prisma.drug.upsert({
      where: { id: drugData.id },
      update: {
        nameKo: drugData.nameKo,
        nameEn: drugData.nameEn,
        category: drugData.category,
        descriptionKo: drugData.descriptionKo,
        descriptionEn: drugData.descriptionEn,
      },
      create: drugData,
    });

    for (const ingredient of ingredients) {
      await prisma.drugIngredient.upsert({
        where: { id: ingredient.id },
        update: {
          nameKo: ingredient.nameKo,
          nameEn: ingredient.nameEn,
          drugId: drugData.id,
        },
        create: {
          ...ingredient,
          drugId: drugData.id,
        },
      });
    }
  }
  console.info(`✅ Seeded ${DRUGS.length} drugs with ingredients`);

  // Seed Interactions
  for (const interaction of INTERACTIONS) {
    const { ingredientId, foodId, ...rest } = interaction;
    // 아래 72행은 손으로 적은 것이고 출처가 없다. 데이터에 그대로 남긴다.
    const data = { ...rest, source: 'seed:manual' };
    await prisma.interaction.upsert({
      where: {
        ingredientId_foodId: { ingredientId, foodId },
      },
      update: data,
      create: { ingredientId, foodId, ...data },
    });
  }
  console.info(`✅ Seeded ${INTERACTIONS.length} interactions`);

  // seed 에서 지운 행을 회수한다. upsert 만 하면 배열에서 삭제한 행이 기존 DB 에
  // 그대로 남는다 — 중복이라 지운 맥주/소주 행 9개가 실제로 남아 있었다.
  // CI 는 매번 빈 DB 라 통과하고 오래된 DB 만 틀리는 종류의 문제다.
  // source = 'seed:manual' 은 "seed.ts 가 적은 행"이라는 뜻이므로, 그 집합은
  // 이 배열이 정의한다. 출처 있는 행은 건드리지 않는다.
  const authored = new Set(INTERACTIONS.map((i) => `${i.ingredientId}|${i.foodId}`));
  const manual = await prisma.interaction.findMany({
    where: { source: 'seed:manual' },
    select: { id: true, ingredientId: true, foodId: true },
  });
  const orphans = manual.filter((m) => !authored.has(`${m.ingredientId}|${m.foodId}`));
  if (orphans.length > 0) {
    await prisma.interaction.deleteMany({ where: { id: { in: orphans.map((o) => o.id) } } });
    console.info(`🧹 seed 에서 지운 상호작용 ${orphans.length}행 삭제`);
  }

  console.info('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
