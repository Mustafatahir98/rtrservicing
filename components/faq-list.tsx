import type { ReactNode } from "react";

const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "Do you offer an automatic payment program?",
    answer: (
      <>
        Yes! We have a free service called ACH (Automatic Clearing House).{" "}
        <a href="https://www.realtimeresolutions.com/wp-content/uploads/2023/01/ACH_Form_20221206.pdf" target="_blank" rel="noreferrer">Click here to print out an ACH form</a>.{" "}
        All you need to do is send back the completed form with a voided check. Alternatively, you may submit this form electronically{" "}
        <a href="https://powerforms.docusign.net/8f1bf172-c5ba-4c53-8f57-450c91192fcc?accountId=156a29ec-1f31-4ec4-aa5d-b6bf80e2e440&env=na3" target="_blank" rel="noreferrer">here</a>.
      </>
    ),
  },
  {
    question: "Can you send me a payoff?",
    answer: <>Yes! <a href="https://www.realtimeresolutions.com/customer-contact/" target="_blank" rel="noreferrer">Submit your request here</a>.</>,
  },
  {
    question: "Where is my tax statement?",
    answer: <>If required, RTR or the account creditor will send an IRS Form 1098 and/or 1099-C by the IRS January 31st deadline.</>,
  },
  {
    question: "If I believe I’ll be late on a payment this month, what should I do?",
    answer: <>Call <a href="tel:18772523761">1-877-252-3761</a> and speak with one of our Customer Solutions Professionals.</>,
  },
  {
    question: "How can I update my contact information?",
    answer: <>Please <a href="https://www.realtimeresolutions.com/wp-content/uploads/2019/11/InfoChange_19-1112.pdf" target="_blank" rel="noreferrer">submit the changes online here</a>, or call <a href="tel:18772523761">1-877-252-3761</a> and speak with one of our Customer Solutions Professionals.</>,
  },
  {
    question: "What are my repayment options?",
    answer: <>We offer multiple payment options including ACH, pay by phone, and recurring payments. If you are unable to make your payments on time and your account is mortgage related, some options that may be available to you include a payment plan or the option to resolve your account for less than you owe. For all other account types, these options may be available to you as well. Please <a href="https://www.realtimeresolutions.com/contact-us/" target="_blank" rel="noreferrer">Contact Us</a> for more information.</>,
  },
  {
    question: "Can I change my account’s due date?",
    answer: <>Yes! <a href="https://www.realtimeresolutions.com/customer-contact/" target="_blank" rel="noreferrer">Submit your request here</a>. The change will go into effect the following month after your form is processed.</>,
  },
];

export default function FaqList() {
  return (
    <div className="faq-list">
      {faqs.map(({ question, answer }) => (
        <details key={question}>
          <summary>
            <span className="faq-question">{question}</span>
            <span className="faq-toggle" aria-hidden="true" />
          </summary>
          <div className="faq-answer">{answer}</div>
        </details>
      ))}
    </div>
  );
}
