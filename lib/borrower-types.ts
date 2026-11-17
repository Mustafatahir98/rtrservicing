import type { CancellationResultStillDue } from "@/api/generated/model";

export type PortalDocument = { id: string; document_type: string; title: string; document_date: string; file_size_bytes: number | null; tax_year: number | null };
export type CancelledPayment = { id: string; amount: string; process_date: string; cancelled_at: string | null; cancellation_confirmation_number: string | null; bank_name: string; account_last4: string; still_due?: CancellationResultStillDue };

export type BorrowerProfile = {
  customer_id: string; borrower_role: "primary" | "co_borrower";
  first_name: string; last_name: string; has_date_of_birth: boolean;
  mail_address_line1: string; mail_address_line2: string; mail_city: string; mail_state: string; mail_zip: string;
  primary_phone: string; primary_phone_type: string; contact_email: string;
  email_consent: boolean; estatement_consent: boolean; sms_consent: boolean; prerecorded_consent: boolean;
  consent_updated_at: string | null; updated_at: string;
};
