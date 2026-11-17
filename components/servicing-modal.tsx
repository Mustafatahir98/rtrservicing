"use client";

import { MouseEvent, useRef } from "react";
import { publicSiteInfo } from "@/lib/public-site-info";

export default function ServicingModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeModal();
  }

  return (
    <>
      <button className="white-button servicing-modal-trigger" type="button" onClick={openModal}>
        Learn how servicing works <span aria-hidden="true">→</span>
      </button>

      <dialog
        ref={dialogRef}
        className="servicing-modal"
        aria-labelledby="servicing-modal-title"
        onClick={closeOnBackdrop}
      >
        <div className="servicing-modal-card">
          <button className="servicing-modal-close" type="button" onClick={closeModal} aria-label="Close dialog">
            <span aria-hidden="true">×</span>
          </button>

          <h2 id="servicing-modal-title">How Loan Servicing Works</h2>
          <div className="servicing-modal-copy">
            <p>
              Loan servicing is the ongoing administration of a loan after it has been issued. This includes collecting payments, maintaining account records, and providing borrower support. A servicing transfer does not itself change your loan agreement. Your payment can still change under that agreement, including changes related to escrow, taxes or insurance.
            </p>
            <p>
              As servicer, RTR Servicing manages the account going forward. This includes collecting monthly payments, keeping accurate records, sending billing statements, and preparing the annual IRS Form 1098 each January.
            </p>
            <p>
              A formal notice will confirm the account number and payment instructions. Once received, the RTR Borrower Portal is available for submitting payments, reviewing payment history, and retrieving account documents.
            </p>
            <p>
              For questions about this transfer, Customer Solutions hours are {publicSiteInfo.hoursShort}. {publicSiteInfo.hoursNote}
            </p>
          </div>

          <a className="servicing-modal-call" href={publicSiteInfo.phone.href}>Call {publicSiteInfo.phone.label}</a>
        </div>
      </dialog>
    </>
  );
}
