import Image from "next/image";
import { cn } from "./portal-ui";

export default function PortalLogo({ className }: { className?: string }) {
  return <span className={cn("tw:inline-flex tw:w-[176px] tw:max-w-full tw:shrink-0 tw:flex-col tw:align-middle tw:max-compact:w-[149px] tw:max-mobile:w-[193px]", className)}>
    <Image className="tw:block tw:h-auto tw:w-full" src="/brand-logo.svg" alt="RTR Servicing" width={176} height={31} unoptimized priority />
    <span className="tw:mt-[9px] tw:text-[9px] tw:leading-none tw:font-[750] tw:tracking-[1.4px] tw:text-[#102f91] tw:max-compact:text-[8px] tw:max-mobile:hidden">BORROWER PORTAL</span>
  </span>;
}
