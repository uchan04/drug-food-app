/** 공유 설정(packages/eslint-config)을 가져다 쓴다. */
module.exports = {
  root: true,
  extends: ["@drug-food-checker/eslint-config"],
  rules: {
    // NestJS 는 emitDecoratorMetadata 로 생성자 파라미터 타입을 런타임에 남겨
    // 의존성을 주입한다. import type 으로 바꾸면 임포트가 완전히 지워져서
    // design:paramtypes 가 비고, 부팅 시 "Nest can't resolve dependencies" 로 죽는다.
    // tsc 와 lint 는 통과하므로 런타임에서만 드러난다. 이 앱에서는 끈다.
    "@typescript-eslint/consistent-type-imports": "off",
  },
};
