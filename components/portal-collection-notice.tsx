import type { ApprovedAccountCollectionNotice } from "@/lib/collection-notice";

export default function PortalCollectionNotice({ notice }: { notice: ApprovedAccountCollectionNotice }) {
  return <aside aria-label="Collection notice" className="tw:mx-auto tw:mt-6 tw:w-[min(1200px,calc(100%_-_40px))] tw:rounded-xl tw:border tw:border-[#9cb3c1] tw:bg-white tw:px-5 tw:py-4 tw:text-[15px] tw:leading-relaxed tw:text-[#08121b] tw:max-mobile:mt-4 tw:max-mobile:px-4">
    <p className="tw:m-0 tw:whitespace-pre-line">{notice.text}</p>
  </aside>;
}
