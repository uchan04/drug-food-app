# Resiliency Extension - 추가 질문

복원력(Resiliency) 확장을 활성화하셨습니다. 아래 질문들은 인프라 및 운영 설계에 필요한 필수 결정 사항입니다.

---

## Q-R1: RTO/RPO 목표 및 재해 복구(DR) 전략 (RESILIENCY-02)

Recovery Time Objective (RTO)와 Recovery Point Objective (RPO) 목표는 무엇인가요? 이 선택이 DR 전략과 인프라 이중화 수준을 결정합니다.

A) RPO/RTO: 시간 단위 — Backup & Restore 전략. 최저 비용($). 데이터 백업, 서비스 미배포. 장애 시 IaC로 재배포 후 백업에서 복구. 비핵심 워크로드에 적합.

B) RPO/RTO: 10분대 — Pilot Light 전략. 비용: $$. 데이터 라이브, 서비스 유휴. 인프라 배포되었으나 실행 안 함, 장애조치 시 스케일업. 중요 워크로드에 적합.

C) RPO/RTO: 분 단위 — Warm Standby 전략. 비용: $$$. 데이터 라이브, 축소 용량으로 서비스 운영. 장애조치 시 스케일업. 비즈니스 핵심 애플리케이션에 적합.

D) RPO/RTO: 실시간 근접 — Multi-site Active/Active 전략. 최고 비용($$$$). 여러 리전에서 동시에 라이브 데이터와 서비스 운영. 무중단 요구사항에 적합.

E) N/A — 단일 리전 배포 허용, 크로스 리전 DR 불필요. 한 리전 내 멀티존 가용성에 의존.

X) 기타 (아래에 직접 기재)

[Answer]: A

---

## Q-R2: 변경 관리 프로세스 (RESILIENCY-03)

이 워크로드의 프로덕션 변경은 어떻게 관리되어야 하나요?

A) 기존 조직의 변경 관리 프로세스 사용 — 도구/프로세스명 기재 (예: ServiceNow, Jira Change, 내부 CAB). AI-DLC가 해당 프로세스에 맞춰 설계.

B) 아직 공식 프로세스 없음 — AI-DLC가 경량 변경 관리 프로세스를 제안 (변경 기록 + 승인 + 롤백 노트).

C) N/A — 이 워크로드는 공식 변경 관리에서 면제 (예: 내부 도구). 면제 사유 문서화.

X) 기타 (아래에 직접 기재)

[Answer]: B

---

## Q-R3: CI/CD 및 배포 도구 (RESILIENCY-04)

이 워크로드에 어떤 CI/CD 도구와 배포 프로세스를 사용할 건가요?

A) 기존 CI/CD 파이프라인 사용 — 도구명 기재 (예: GitHub Actions, GitLab CI, Jenkins, CodePipeline). AI-DLC가 호환 아티팩트 생성.

B) 파이프라인 없음 — AI-DLC가 선택된 IaC와 런타임에 적합한 CI/CD 파이프라인 정의 제안.

X) 기타 (아래에 직접 기재)

[Answer]: A

---

## Q-R4: 롤백 메커니즘 (RESILIENCY-04)

실패한 프로덕션 배포를 어떻게 롤백할 건가요?

A) 이전 IaC/아티팩트 버전 재배포 (버전 고정 롤백)

B) Blue/green 스왑으로 이전 환경 복귀

C) Canary 자동 롤백 (헬스/메트릭 회귀 시)

D) 데이터베이스 인식 롤백 필요 (스키마/데이터 마이그레이션 역전) — 명시적 설계 필요 플래그

E) 조직의 기존 롤백 절차 사용 — 참조 제공

X) 기타 (아래에 직접 기재)

[Answer]: A

---

## Q-R5: 배포 전략 (RESILIENCY-04)

이 워크로드의 리스크 프로필에 적합한 배포 전략은?

A) Direct / in-place (최저 비용, 최대 영향 범위) — 비핵심 워크로드에 적합

B) Rolling (점진적 인스턴스 교체)

C) Blue/green (무중단 전환, 높은 비용)

D) Canary (점진적 트래픽 전환 + 자동 롤백)

X) 기타 (아래에 직접 기재)

[Answer]: A

---

## Q-R6: 인시던트 대응 프로세스 (RESILIENCY-15)

이 워크로드의 프로덕션 인시던트는 어떻게 처리하나요?

A) 기존 인시던트 대응 프로세스 사용 — 참조 제공 (예: PagerDuty 런북, 내부 IR/온콜 프로세스). AI-DLC가 알림/런북을 맞춤.

B) 공식 프로세스 없음 — AI-DLC가 경량 인시던트 대응 및 COE(Correction of Errors) 프로세스 제안.

X) 기타 (아래에 직접 기재)

[Answer]: B

---

## 작성 안내

각 질문의 `[Answer]:` 태그 뒤에 선택한 옵션을 기재해주세요.
