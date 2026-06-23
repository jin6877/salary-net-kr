# 💰 연봉 실수령액 계산기

> 세전 연봉에서 4대보험·소득세를 공제한 **진짜 내 월급**을 계산해주는 한국 직장인용 웹 앱

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)

## 🔗 라이브 데모

**[https://salary-net-kr.vercel.app](https://salary-net-kr.vercel.app)**

![앱 스크린샷](docs/screenshot.png)

## ✨ 주요 기능

- 💵 **월/연 실수령액 계산** — 세전 연봉을 입력하면 4대보험과 소득세를 공제한 실수령액을 즉시 표시
- 📊 **공제 항목 상세 분해** — 국민연금·건강보험·장기요양·고용보험·근로소득세·지방소득세를 항목별 금액 + 비율로 막대그래프 시각화
- ⚙️ **세밀한 입력 옵션**
  - 월 비과세액(식대 등, 기본 20만원) 조정
  - 부양가족 수(본인 포함) · 20세 이하 자녀 수 → 소득세 계산에 반영
  - 연봉에 퇴직금 포함/별도 선택
- 🆚 **연봉 비교 모드** — 현재 연봉 vs 인상/이직 후 연봉을 나란히 비교, 월·연 실수령 차이 표시
- ⚡ **실시간 계산** — 슬라이더·입력값 변경 즉시 결과 갱신
- ✨ **밝고 깔끔한 미니멀 UI** — 흰 카드 + 얇은 회색 보더, 절제된 블루 단색 액센트, 천단위 콤마·원화 표기, 반응형

## 📐 계산 기준 (2025년)

| 항목 | 요율 |
|------|------|
| 국민연금 | 4.5% (기준소득월액 상한 617만 / 하한 39만 적용) |
| 건강보험 | 3.545% |
| 장기요양보험 | 건강보험료 × 12.95% |
| 고용보험 | 0.9% |
| 근로소득세 | 간이세액표 방식 근사 (근로소득공제·인적공제·자녀세액공제 반영) |
| 지방소득세 | 근로소득세 × 10% |

> 요율은 `src/lib/salary.ts` 상단 상수(`RATES`)로 분리되어 매년 쉽게 갱신할 수 있습니다.
> 본 계산은 추정치이며, 실제 급여명세서와는 회사 정책·비과세 항목·세액공제 등에 따라 차이가 있을 수 있습니다.

## 🛠 기술 스택

- **React 19** + **TypeScript**
- **Vite** (빌드 도구)
- **Tailwind CSS v4**
- 100% 클라이언트 사이드 — 서버/API 불필요

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
```
