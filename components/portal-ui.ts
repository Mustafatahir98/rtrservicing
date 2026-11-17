import { extendTailwindMerge } from "tailwind-merge";

// In Tailwind v4 a leading-* class always wins over a text size's default line height,
// so font sizes must not remove an earlier leading-* (tailwind-merge does that by default).
const twMerge = extendTailwindMerge({ prefix: "tw", override: { conflictingClassGroups: { "font-size": [] } } });

/** Joins class names; when two classes set the same property (e.g. two paddings), the later one wins. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}

/** Shared portal button styles. Compose with cn(), e.g. cn(button.base, button.primary, "tw:px-4"). */
export const button = {
  base: "tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:min-h-[60px] tw:rounded-[11px] tw:border tw:px-[30px] tw:py-[13px] tw:text-[20px] tw:leading-[1.25] tw:font-medium tw:whitespace-nowrap tw:[transition:background_.15s,border-color_.15s] tw:max-compact:min-h-[52px] tw:max-compact:px-[22px] tw:max-compact:text-[17px] tw:max-mobile:min-h-[60px] tw:max-mobile:rounded-[10px] tw:max-mobile:px-5 tw:max-mobile:py-3.5 tw:max-mobile:text-center tw:max-mobile:text-[20px] tw:max-mobile:leading-[1.4] tw:max-mobile:whitespace-normal",
  primary: "tw:border-(--pp-blue) tw:bg-(--pp-blue) tw:text-white tw:hover:border-[#005b8a] tw:hover:bg-[#005b8a]",
  outline: "tw:border-[#233545] tw:bg-white tw:text-(--pp-ink) tw:hover:bg-[#f0f8fc]",
  /** For <button> elements: they keep the surrounding 16px regular font up to the mobile breakpoint; links use the base sizes. */
  element: "tw:text-[16px] tw:leading-[1.5] tw:font-normal tw:max-compact:text-[16px] tw:max-mobile:leading-[1.4]",
};

export const container = "tw:mx-auto tw:w-[min(1312px,calc(100%_-_96px))] tw:max-compact:w-[calc(100%_-_56px)] tw:max-mobile:w-[calc(100%_-_32px)] tw:print:w-full";
export const page = `${container} tw:mt-12 tw:pb-14 tw:max-mobile:mt-0 tw:max-mobile:pb-6`;
export const pageHeading = "tw:mb-14 tw:flex tw:items-center tw:justify-between tw:gap-7 tw:max-compact:mb-9 tw:max-mobile:mb-8 tw:max-mobile:block tw:print:hidden";
export const pageTitle = "tw:mb-2 tw:text-[40px] tw:leading-[1.2] tw:font-medium tw:tracking-[-1.8px] tw:max-compact:text-[32px] tw:max-mobile:text-[26px] tw:max-mobile:tracking-[-0.7px]";
export const pageIntro = "tw:text-[16px] tw:leading-[1.7] tw:text-(--pp-muted) tw:max-compact:text-[14px] tw:max-mobile:mt-4 tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.5]";
export const textButton = "tw:border-0 tw:bg-transparent tw:p-0 tw:text-(--pp-blue) tw:underline tw:underline-offset-[3px]";

/** Segmented control: `segmented` on the group, `segment(active)` on each link or button. */
export const segmented = "tw:flex tw:items-stretch tw:rounded-[11px] tw:border tw:border-[#778eae] tw:bg-white tw:p-[3px] tw:max-mobile:flex-1";
export const segment = (active: boolean) => cn(
  "tw:rounded-[9px] tw:border-0 tw:bg-transparent tw:px-6 tw:py-3.5 tw:text-[16px] tw:whitespace-nowrap tw:text-(--pp-ink) tw:max-mobile:flex-1 tw:max-mobile:px-3 tw:max-mobile:py-[11px] tw:max-mobile:text-center tw:max-mobile:text-[12px]",
  active && "tw:bg-(--pp-blue) tw:font-semibold tw:text-white tw:underline tw:underline-offset-4",
);
