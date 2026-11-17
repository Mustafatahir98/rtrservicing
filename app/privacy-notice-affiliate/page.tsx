import type { Metadata } from "next";
import NoticePage, { type NoticeData } from "@/app/_privacy-notices/notice-page";
import content from "@/app/_privacy-notices/affiliate.json";

export const metadata: Metadata = {
  title: "Affiliate Privacy Notice | RTR Servicing",
  description: "Read RTR Servicing's Affiliate Privacy Notice, information-sharing practices, and options to limit sharing.",
  alternates: { canonical: "/privacy-notice-affiliate" },
};

export default function AffiliatePrivacyNotice() {
  return <NoticePage notice={content as NoticeData} />;
}
