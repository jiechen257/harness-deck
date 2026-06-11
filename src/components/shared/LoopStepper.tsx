import type { Locale } from "../../lib/types";

export type LoopStep = "signal" | "practice" | "asset" | "projection" | "review";

const steps: { id: LoopStep; zh: string; en: string }[] = [
  { id: "signal", zh: "信号", en: "Signal" },
  { id: "practice", zh: "实践", en: "Practice" },
  { id: "asset", zh: "资产", en: "Asset" },
  { id: "projection", zh: "投射", en: "Projection" },
  { id: "review", zh: "评审", en: "Review" },
];

export function LoopStepper({ activeStep, locale }: { activeStep: LoopStep; locale: Locale }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const zh = locale === "zh-CN";

  return (
    <ol className="loop-stepper" aria-label={zh ? "闭环位置" : "Loop position"}>
      {steps.map((step, index) => (
        <li
          key={step.id}
          className={index < activeIndex ? "done" : index === activeIndex ? "active" : ""}
          aria-current={index === activeIndex ? "step" : undefined}
        >
          <span>{index + 1}</span>
          <b>{zh ? step.zh : step.en}</b>
        </li>
      ))}
    </ol>
  );
}
