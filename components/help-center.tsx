"use client";

import { useId, useMemo, useState } from "react";

const categories = ["Account Transfers", "Payments & AutoPay", "Tax Form 1098 & Statements", "Hardship & Assistance"] as const;
type Category = (typeof categories)[number];

/* Only the first answer comes from the design; the others are draft copy for the client to confirm. */
const faqs: { category: Category; question: string; answer: string }[] = [
  {
    category: "Account Transfers",
    question: "Why was my account transferred to RTR?",
    answer: "Account management rights transfer regularly in the secondary financial markets. Your note terms, interest rate, remaining balance, and monthly payment amount remain exactly identical.",
  },
  {
    category: "Account Transfers",
    question: "What is the 60-day federal grace period?",
    answer: "For 60 days after your servicing transfer date, a payment you send on time to your previous servicer cannot be treated as late, and no late fee can be charged for it. Your previous servicer will forward it to us.",
  },
  {
    category: "Payments & AutoPay",
    question: "How can I make my monthly payment?",
    answer: "Sign in to your account to pay online, set up AutoPay, or call our Customer Care team at 877-252-3761 for other payment options.",
  },
  {
    category: "Payments & AutoPay",
    question: "Can I choose my AutoPay draft day?",
    answer: "Yes. When you set up AutoPay in your online account you can pick the draft date that works best for you, as long as your payment is still received by its due date.",
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

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

export default function HelpCenter() {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [active, setActive] = useState<Category | "All Categories">("All Categories");
  const [open, setOpen] = useState<string | null>(faqs[0].question);

  const visibleFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return faqs.filter((faq) => (active === "All Categories" || faq.category === active) && (!term || `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(term)));
  }, [active, query]);

  const visibleCategories = categories.filter((category) => category.toLowerCase().includes(categoryQuery.trim().toLowerCase()));

  return (
    <>
      <section className="hc-hero" aria-labelledby="hc-title">
        <div className="hc-hero-inner">
          <span className="hm-badge">Help Center &amp; FAQs</span>
          <h1 id="hc-title">How Can We <span>Help You?</span></h1>
          <p>Search our knowledgebase or pick a topic category below to find instant answers:</p>
          <label className="hc-search">
            <span className="hc-visually-hidden">Search the help center</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. AutoPay, statements, Form 1098" aria-controls={listId} />
            <SearchIcon />
          </label>
        </div>
      </section>

      <section className="hc-faq hm-shell" aria-label="Frequently asked questions">
        <aside className="hc-sidebar">
          <h2>Browse Categories</h2>

          <div className="hc-sidebar-desktop">
            <input className="hc-category-search" type="search" value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Search Categories" aria-label="Search categories" />
            <div className="hc-category-list">
              {(["All Categories", ...visibleCategories] as const).map((category) => (
                <button key={category} type="button" className={active === category ? "is-active" : undefined} aria-pressed={active === category} onClick={() => { setActive(category); setOpen(null); }}>
                  {category}
                </button>
              ))}
              {visibleCategories.length === 0 ? <p className="hc-empty-small">No matching categories.</p> : null}
            </div>
          </div>

          <label className="hc-category-select">
            <span className="hc-visually-hidden">Category</span>
            <select value={active} onChange={(event) => { setActive(event.target.value as Category | "All Categories"); setOpen(null); }}>
              <option>All Categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </aside>

        <div className="hc-results">
          <h2>{active}</h2>
          <p className="hc-count" aria-live="polite">Showing {visibleFaqs.length} {visibleFaqs.length === 1 ? "answer" : "answers"}</p>

          <ul id={listId} className="hc-accordion">
            {visibleFaqs.map((faq, index) => {
              const isOpen = open === faq.question;
              const panelId = `${listId}-panel-${index}`;
              return (
                <li key={faq.question} className={isOpen ? "is-open" : undefined}>
                  <button type="button" className="hc-question" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : faq.question)}>
                    <span className="hc-tag">{faq.category}</span>
                    <span className="hc-question-text">{faq.question}</span>
                    <span className="hc-toggle" aria-hidden="true" />
                  </button>
                  <div id={panelId} className="hc-answer" hidden={!isOpen}>
                    <p>{faq.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {visibleFaqs.length === 0 ? (
            <p className="hc-empty">No answers match your search. Try a different word, or <a href="tel:+18772523761">call 877-252-3761</a>.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
