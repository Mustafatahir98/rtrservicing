import { publicSiteInfo } from "./public-site-info";
export const categories = ["Account Transfers", "Payments & AutoPay", "Tax Form 1098 & Statements", "Hardship & Assistance"] as const;
export type Category = (typeof categories)[number];

/* Draft public help copy; RTR approval and account-specific applicability remain required. */
export const faqs: { category: Category; question: string; answer: string }[] = [
  {
    category: "Account Transfers",
    question: "Why was my account transferred to RTR?",
    answer: "A servicing transfer changes who manages your account; it does not by itself rewrite your loan agreement. Your payment can still change under that agreement, including changes related to escrow, taxes or insurance. Check your transfer notice and current statement, and contact Customer Solutions if an amount is unclear.",
  },
  {
    category: "Account Transfers",
    question: "What is the 60-day federal grace period?",
    answer: "For mortgage loans covered by the federal servicing-transfer rule, a payment received by the previous servicer by the applicable due date, including any allowed grace period, during the 60 days beginning on the effective transfer date cannot be treated as late for that reason. This is not permission to skip or postpone payments. Follow your transfer notice and ask Customer Solutions about your account's timing and payment instructions.",
  },
  {
    category: "Payments & AutoPay",
    question: "How can I make my monthly payment?",
    answer: `Sign in to your account to review available payment options, or call Customer Solutions at ${publicSiteInfo.phone.label} for help.`,
  },
  {
    category: "Payments & AutoPay",
    question: "Can I choose my AutoPay draft day?",
    answer: "Available AutoPay frequencies and draft dates depend on your account. Review the schedule, any fee warnings and the authorization before enrolling. A draft date is not a guarantee of when a payment will post; contact Customer Solutions if you need help selecting a schedule.",
  },
  {
    category: "Payments & AutoPay",
    question: "Can I make extra payments toward principal?",
    answer: "Yes. You can add an additional principal amount when you make a payment online. Extra payments are applied according to the terms of your account documents.",
  },
  {
    category: "Tax Form 1098 & Statements",
    question: "When will my IRS Form 1098 Statement be ready?",
    answer: "Form 1098 is issued by January 31 each year for the previous tax year. You can download it from the Statements section of your online account once it is available.",
  },
  {
    category: "Tax Form 1098 & Statements",
    question: "How many months of statements can I access online?",
    answer: "Your monthly statements are available in the Statements section of your online account. If you need a statement you can't find there, contact Customer Care and we'll help.",
  },
  {
    category: "Hardship & Assistance",
    question: "What should I do if I am facing financial hardship?",
    answer: "Contact us as early as possible. Our team will review your situation and walk you through the assistance options that may be available to you.",
  },
];
