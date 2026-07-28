# Unit Test Instructions

## Test Framework
- **Runner**: Vitest 1.x
- **PBT**: fast-check 3.x (via `@fast-check/vitest`)

## Running Tests

```bash
# Run all unit tests
pnpm test

# Run PBT tests only
pnpm test:pbt

# Run tests for specific app
pnpm --filter api test
pnpm --filter web test

# Watch mode (development)
pnpm --filter api test:watch
```

## PBT Test Configuration

- **Seed logging**: Vitest automatically logs seeds on failure
- **Reproducibility**: Re-run failed test with `FAST_CHECK_SEED=<seed> pnpm test:pbt`
- **CI integration**: PBT runs in CI pipeline (`.github/workflows/ci.yml`)

## Test Files Location

```
apps/api/test/
├── generators/
│   └── drug.generator.ts     # Domain-specific generators (PBT-07)
└── pbt/
    └── interaction.pbt.spec.ts  # Invariant tests (PBT-03)
```

## PBT Coverage

| Property | Category | Test File |
|----------|----------|-----------|
| RiskLevel always valid | Invariant (PBT-03) | interaction.pbt.spec.ts |
| TimeGap null or 1-72 | Invariant (PBT-03) | interaction.pbt.spec.ts |
| Summary counts = total | Invariant (PBT-03) | interaction.pbt.spec.ts |
| Sort preserves elements | Invariant (PBT-03) | interaction.pbt.spec.ts |
