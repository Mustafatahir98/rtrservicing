import type { Metadata } from "next";
import MockBorrowerPage from "@/components/mock-borrower-page";
export const metadata: Metadata = { title: "Payment Cancelled | RTR Servicing" };
export default function Page() { return <MockBorrowerPage view="cancelled" />; }
