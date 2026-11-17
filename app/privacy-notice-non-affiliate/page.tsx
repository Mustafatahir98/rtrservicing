import type { Metadata } from "next";
import NoticePage, { type NoticeData } from "@/app/_privacy-notices/notice-page";
import content from "@/app/_privacy-notices/non-affiliate.json";

export const metadata: Metadata = {
  title: "Non-Affiliate Privacy Notice | RTR Servicing",
  description: "Read RTR Servicing's Non-Affiliate Privacy Notice and how personal information is collected, protected, and shared.",
  alternates: { canonical: "/privacy-notice-non-affiliate" },
};

export default function NonAffiliatePrivacyNotice() {
  return <NoticePage notice={content as NoticeData} />;
}
