import { cn } from "./portal-ui";

export const sitePage = "tw:min-h-screen tw:overflow-x-clip tw:bg-white tw:font-site tw:text-base tw:leading-[1.4] tw:text-site-ink tw:touch-pan-y tw:touch-pinch-zoom tw:[&_a:focus-visible]:outline-3 tw:[&_a:focus-visible]:outline-[#00649e] tw:[&_a:focus-visible]:outline-offset-2 tw:[&_button:focus-visible]:outline-3 tw:[&_button:focus-visible]:outline-[#00649e] tw:[&_button:focus-visible]:outline-offset-2 tw:motion-reduce:[&_*]:transition-none";
export const siteShell = "tw:mx-auto tw:w-[min(1312px,calc(100%_-_128px))] tw:max-site-tablet:w-[calc(100%_-_64px)] tw:max-site-mobile:w-[calc(100%_-_40px)]";
export const sectionSpacing = "tw:py-24 tw:max-site-tablet:py-16 tw:max-site-mobile:py-12";
export const siteBadge = "tw:inline-block tw:rounded-md tw:bg-site-blue tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:tracking-[.04em] tw:text-white tw:max-site-mobile:px-3 tw:max-site-mobile:py-[7px] tw:max-site-mobile:text-[11px]";
const buttonBase = "tw:inline-flex tw:min-h-12 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-solid tw:border-transparent tw:px-6 tw:py-2.5 tw:text-base tw:font-medium tw:leading-[1.2] tw:whitespace-nowrap tw:transition tw:hover:-translate-y-px tw:disabled:cursor-progress tw:disabled:opacity-75 tw:disabled:transform-none";
const buttonTones = {
  blue: "tw:bg-site-blue tw:text-white tw:hover:bg-site-blue-dark tw:hover:shadow-[0_8px_20px_#00649e40]",
  outline: "tw:border-site-ink tw:bg-white tw:text-site-ink tw:hover:border-site-blue tw:hover:text-site-blue",
  dark: "tw:border-site-ink tw:bg-white tw:text-site-ink tw:hover:bg-site-ink tw:hover:text-white",
  white: "tw:border-white tw:bg-white tw:text-site-ink tw:hover:shadow-[0_8px_20px_#0000002e]",
};
export function siteButton(tone: keyof typeof buttonTones = "blue", classes?: string) {
  return cn(buttonBase, buttonTones[tone], classes);
}

export const authCard = "tw:scroll-mt-[120px] tw:rounded-[14px] tw:bg-white tw:px-[34px] tw:pt-[34px] tw:pb-8 tw:shadow-[0_24px_60px_#000e161f] tw:max-site-tablet:px-6 tw:max-site-tablet:py-[26px] tw:max-site-stack:w-full tw:max-site-stack:max-w-[560px] tw:max-site-mobile:max-w-none tw:max-site-mobile:p-[clamp(20px,7.6vw,28px)]";
export const authHeading = "tw:m-0 tw:text-[26px] tw:font-medium tw:leading-[1.3] tw:text-site-blue tw:max-site-mobile:text-center tw:max-site-mobile:text-[clamp(18px,7.1vw,28px)]";
export const authForm = "tw:mt-[26px] tw:grid tw:gap-4 tw:max-site-mobile:mt-6 tw:max-site-mobile:gap-[clamp(12px,4.3vw,16px)]";
export const authField = "tw:grid tw:min-w-0 tw:gap-2.5 tw:text-[15px] tw:max-site-mobile:gap-4 tw:max-site-mobile:text-[clamp(12px,4.3vw,15px)]";
export const authInput = "tw:h-[54px] tw:w-full tw:min-w-0 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#6b7c8e] tw:bg-white tw:px-5 tw:py-0 tw:text-[16px] tw:text-site-ink tw:transition-colors tw:placeholder:text-[#52657e] tw:focus:border-site-blue tw:focus-visible:outline-3 tw:focus-visible:outline-[#00649e] tw:focus-visible:outline-offset-2 tw:max-site-mobile:h-[clamp(40px,14.4vw,54px)] tw:max-site-mobile:border-site-line tw:max-site-mobile:pl-[18px] tw:max-site-mobile:text-[16px]";
export const authAction = "tw:min-h-[58px] tw:w-full tw:text-[17px] tw:max-site-mobile:min-h-[clamp(42px,15.1vw,56px)] tw:max-site-mobile:text-[clamp(15px,5.4vw,18px)]";
export const authMessage = "tw:m-0 tw:rounded-lg tw:bg-site-blue-soft tw:px-3.5 tw:py-3 tw:text-sm tw:text-site-blue-dark";

export const contactField = "tw:grid tw:min-w-0 tw:gap-3 tw:text-[15px] tw:font-medium tw:max-site-mobile:gap-[18px] tw:max-site-mobile:text-base tw:max-site-mobile:font-normal";
export const contactInput = "tw:h-14 tw:w-full tw:min-w-0 tw:rounded-lg tw:border tw:border-solid tw:border-[#6b7c8e] tw:bg-white tw:px-[18px] tw:py-0 tw:text-[16px] tw:font-normal tw:text-site-ink tw:transition-shadow tw:focus:border-site-blue tw:focus-visible:outline-3 tw:focus-visible:outline-[#00649e] tw:focus-visible:outline-offset-2 tw:focus:shadow-[0_0_0_4px_#00649e1f] tw:user-invalid:border-[#c2412d] tw:max-site-mobile:h-[54px] tw:max-site-mobile:rounded-xl tw:max-site-mobile:border-[#7d858b] tw:max-site-mobile:px-6";
export const contactSelect = "tw:relative tw:block tw:after:pointer-events-none tw:after:absolute tw:after:top-1/2 tw:after:right-[22px] tw:after:size-2 tw:after:-translate-y-[70%] tw:after:rotate-45 tw:after:border-0 tw:after:border-r-2 tw:after:border-b-2 tw:after:border-solid tw:after:border-site-ink tw:after:content-['']";
