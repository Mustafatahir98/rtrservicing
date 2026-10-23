"use client";

import { MouseEvent, useRef } from "react";

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

          <h2 id="servicing-modal-title">How Account Servicing Works</h2>
          <div className="servicing-modal-copy">
            <p>
              RTR Servicing manages your account on behalf of your original lender. Your account terms stay exactly as your lender set them. Your interest rate, monthly payment, and balance remain unchanged.
            </p>
            <p>
              RTR Servicing collects your monthly payments, maintains your account records, sends your billing statements, and provides your annual IRS Form 1098 tax document when applicable.
            </p>
            <p>
              Once you receive your welcome letter with your RTR account number and payment instructions, you can sign into the RTR Borrower Portal to make payments, view your statement history, and download documents at any time.
            </p>
            <p>
              Do you have questions about your transfer? Our team is available Monday through Thursday, 7am to 9pm CT, and Friday, 7am to 7pm CT.
            </p>
          </div>

          <a className="servicing-modal-call" href="tel:8772523761">Call 877-252-3761</a>
        </div>
      </dialog>
    </>
  );
}
