import { useMemo, useState } from "react";
import {
  calculate,
  formatKRW,
  formatEok,
  BASE_YEAR,
  DEFAULT_NONTAX_MONTHLY,
  RATES,
  type CalcInput,
} from "./lib/salary";
import DeductionBars from "./components/DeductionBars";

const MIN_SAL = 20_000_000;
const MAX_SAL = 200_000_000;
const STEP = 1_000_000;

interface Options {
  nonTaxMonthly: number;
  dependents: number;
  childrenUnder20: number;
  severanceIncluded: boolean;
}

const defaultOptions: Options = {
  nonTaxMonthly: DEFAULT_NONTAX_MONTHLY,
  dependents: 1,
  childrenUnder20: 0,
  severanceIncluded: false,
};

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold tabular-nums sm:text-3xl ${accent ? "text-blue-600" : "text-gray-900"}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function OptionsPanel({ opts, setOpts }: { opts: Options; setOpts: (o: Options) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm text-gray-600">월 비과세액 (식대 등)</span>
        <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white focus-within:border-blue-500">
          <input
            type="number"
            value={opts.nonTaxMonthly}
            min={0}
            step={10000}
            onChange={(e) => setOpts({ ...opts, nonTaxMonthly: Math.max(0, Number(e.target.value)) })}
            className="w-full bg-transparent px-3 py-2 text-right tabular-nums text-gray-900 outline-none"
          />
          <span className="pr-3 text-sm text-gray-400">원</span>
        </div>
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">부양가족 수 (본인 포함)</span>
        <input
          type="number"
          value={opts.dependents}
          min={1}
          max={11}
          onChange={(e) => setOpts({ ...opts, dependents: Math.max(1, Math.min(11, Number(e.target.value))) })}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-right tabular-nums text-gray-900 outline-none focus:border-blue-500"
        />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">20세 이하 자녀 수</span>
        <input
          type="number"
          value={opts.childrenUnder20}
          min={0}
          max={10}
          onChange={(e) => setOpts({ ...opts, childrenUnder20: Math.max(0, Math.min(10, Number(e.target.value))) })}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-right tabular-nums text-gray-900 outline-none focus:border-blue-500"
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 sm:mt-6">
        <span className="text-sm text-gray-600">연봉에 퇴직금 포함</span>
        <button
          type="button"
          onClick={() => setOpts({ ...opts, severanceIncluded: !opts.severanceIncluded })}
          className={`relative h-6 w-11 rounded-full transition-colors ${opts.severanceIncluded ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${opts.severanceIncluded ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </label>
    </div>
  );
}

function SalaryInput({ salary, setSalary }: { salary: number; setSalary: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="text-sm text-gray-600">세전 연봉</span>
        <div className="flex items-center rounded-lg border border-gray-200 bg-white focus-within:border-blue-500">
          <input
            type="number"
            value={salary}
            min={0}
            step={STEP}
            onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
            className="w-44 bg-transparent px-3 py-2 text-right text-lg font-semibold tabular-nums text-gray-900 outline-none"
          />
          <span className="pr-3 text-sm text-gray-400">원</span>
        </div>
      </div>
      <input
        type="range"
        min={MIN_SAL}
        max={MAX_SAL}
        step={STEP}
        value={Math.min(Math.max(salary, MIN_SAL), MAX_SAL)}
        onChange={(e) => setSalary(Number(e.target.value))}
        className="mt-3 w-full accent-blue-600"
      />
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>2천만원</span>
        <span className="text-gray-500">{formatEok(salary)}</span>
        <span>2억원</span>
      </div>
    </div>
  );
}

export default function App() {
  const [salary, setSalary] = useState(50_000_000);
  const [opts, setOpts] = useState<Options>(defaultOptions);
  const [compareMode, setCompareMode] = useState(false);
  const [salaryB, setSalaryB] = useState(60_000_000);

  const buildInput = (s: number): CalcInput => ({
    annualGross: s,
    nonTaxMonthly: opts.nonTaxMonthly,
    dependents: opts.dependents,
    childrenUnder20: opts.childrenUnder20,
    severanceIncluded: opts.severanceIncluded,
  });

  const result = useMemo(() => calculate(buildInput(salary)), [salary, opts]);
  const resultB = useMemo(() => calculate(buildInput(salaryB)), [salaryB, opts]);

  const netDiff = resultB.netMonthly - result.netMonthly;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {/* 헤더 */}
        <header className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">
            {BASE_YEAR}년 기준 요율 적용
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            연봉 실수령액 계산기
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            세전 연봉에서 4대보험·소득세를 공제한 진짜 내 월급을 계산합니다.
          </p>
        </header>

        {/* 모드 토글 */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setCompareMode(false)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${!compareMode ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              단일 계산
            </button>
            <button
              onClick={() => setCompareMode(true)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${compareMode ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              연봉 비교
            </button>
          </div>
        </div>

        {/* 입력 카드 */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <SalaryInput salary={salary} setSalary={setSalary} />
          {compareMode && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="mb-1 text-xs font-medium text-gray-500">비교 대상 연봉 (인상/이직 후)</div>
              <SalaryInput salary={salaryB} setSalary={setSalaryB} />
            </div>
          )}
          <div className="mt-7 border-t border-gray-200 pt-6">
            <OptionsPanel opts={opts} setOpts={setOpts} />
          </div>
        </section>

        {/* 결과 */}
        {!compareMode ? (
          <>
            <section className="mt-6 grid grid-cols-2 gap-4">
              <Stat
                label="월 실수령액"
                value={`${formatKRW(result.netMonthly)}원`}
                sub={`세전 월급 ${formatKRW(result.monthlyGross)}원`}
                accent
              />
              <Stat
                label="연 실수령액"
                value={formatEok(result.netAnnual)}
                sub={`${formatKRW(result.netAnnual)}원`}
              />
              <Stat
                label="월 공제 합계"
                value={`${formatKRW(result.totalDeductionMonthly)}원`}
                sub={`연 ${formatKRW(result.totalDeductionAnnual)}원`}
              />
              <Stat
                label="공제율"
                value={`${result.monthlyGross > 0 ? ((result.totalDeductionMonthly / result.monthlyGross) * 100).toFixed(1) : "0"}%`}
                sub="세전 대비 떼는 비율"
              />
            </section>

            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">공제 항목 상세 (월 기준)</h2>
              <DeductionBars deductions={result.deductions} monthlyGross={result.monthlyGross} />
            </section>
          </>
        ) : (
          <section className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="현재 월 실수령" value={`${formatKRW(result.netMonthly)}원`} sub={formatEok(salary)} />
              <Stat label="비교 월 실수령" value={`${formatKRW(resultB.netMonthly)}원`} sub={formatEok(salaryB)} accent />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
              <div className="text-xs font-medium text-gray-500">월 실수령 차이</div>
              <div className={`mt-1 text-3xl font-semibold tabular-nums ${netDiff >= 0 ? "text-blue-600" : "text-gray-900"}`}>
                {netDiff >= 0 ? "+" : "−"}{formatKRW(Math.abs(netDiff))}원
              </div>
              <div className="mt-1 text-sm text-gray-400">
                연 {netDiff >= 0 ? "+" : "−"}{formatKRW(Math.abs(netDiff) * 12)}원 ·
                연봉 차이 {formatKRW(Math.abs(salaryB - salary))}원
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">현재 · 공제 상세</h3>
                <DeductionBars deductions={result.deductions} monthlyGross={result.monthlyGross} />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-blue-600">비교 · 공제 상세</h3>
                <DeductionBars deductions={resultB.deductions} monthlyGross={resultB.monthlyGross} />
              </div>
            </div>
          </section>
        )}

        {/* 계산 기준 안내 */}
        <footer className="mt-8 rounded-xl border border-gray-200 bg-white p-5 text-xs leading-relaxed text-gray-400">
          <p className="mb-2 font-semibold text-gray-500">계산 기준 ({BASE_YEAR}년)</p>
          <ul className="space-y-1">
            <li>· 국민연금 {(RATES.nationalPension * 100).toFixed(1)}% (기준소득월액 상한 617만 / 하한 39만 적용)</li>
            <li>· 건강보험 {(RATES.healthInsurance * 100).toFixed(3)}%, 장기요양 = 건강보험료 × {(RATES.longTermCare * 100).toFixed(2)}%</li>
            <li>· 고용보험 {(RATES.employment * 100).toFixed(1)}% · 근로소득세는 간이세액표 방식 근사(부양가족·자녀 공제 반영), 지방소득세 = 소득세 10%</li>
          </ul>
          <p className="mt-3 text-gray-400">
            ※ 본 계산은 추정치이며, 실제 급여명세서 금액과는 회사 정책·비과세 항목·세액공제 등에 따라 차이가 있을 수 있습니다.
          </p>
        </footer>
      </div>
    </div>
  );
}
