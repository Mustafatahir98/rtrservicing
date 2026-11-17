import type { Metadata } from "next";
import MockBorrowerPage from "@/components/mock-borrower-page";
export const metadata: Metadata = { title: "Make & Schedule Payments | RTR Servicing" };
export default function Page() { return <MockBorrowerPage view="payments" />; }
