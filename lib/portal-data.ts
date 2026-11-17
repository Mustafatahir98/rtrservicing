export type PortalLoan = {
  rtr_loan_id: string; account_number: string; asset_class: string; loan_position: string | null;
  property_address_line1: string | null; property_city: string | null; property_state: string | null; property_zip: string | null;
  account_payment_amount: string | null; account_total_due: string | null; account_due_date: string | null;
  current_balance: string | null; original_balance: string | null; annual_interest_rate: string | null;
  origination_date: string | null; maturity_date: string | null; servicing_phone: string | null;
  current_payment_principal: string | null; current_payment_interest: string | null; current_payment_escrow: string | null;
  account_payoff: string | null; servicing_status: string;
};
export type PortalPayment = {
  id: string; confirmation_number: string; amount: string; process_date: string; status: string;
  principal_amount: string; interest_amount: string; escrow_amount: string; fees_amount: string;
  additional_principal_amount: string; posted_at: string | null; initiated_by: string;
  bank_name: string; account_last4: string; applied_to: string | null;
  allocation_pending?: boolean; return_reason?: string | null;
};
