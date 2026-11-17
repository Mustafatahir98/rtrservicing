"use client";

import { categories, faqs as fallbackFaqs, type Category } from "@/lib/public-faqs";
import { publicSiteInfo } from "@/lib/public-site-info";
import { borrowerMockMode } from "@/lib/mock-mode";
import { useListFaqs } from "@/lib/api/generated/public/public";
import { useId, useMemo, useState } from "react";
import { cn } from "./portal-ui";
import { siteBadge, siteShell, contactSelect, sectionSpacing } from "./site-ui";


function SearchIcon() {
  return <svg className="tw:pointer-events-none tw:absolute tw:top-1/2 tw:right-[22px] tw:size-[22px] tw:-translate-y-1/2 tw:fill-none tw:stroke-site-blue tw:stroke-2 tw:[stroke-linecap:round] tw:max-site-mobile:right-[18px]" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

export default function HelpCenter() { return borrowerMockMode ? <ContractHelpCenter /> : <HelpCenterContent faqs={fallbackFaqs} />; }
function ContractHelpCenter() {
  const query = useListFaqs();
  if (query.isPending) return <p role="status">Loading frequently asked questions…</p>;
  if (query.isError) return <div role="alert"><p>Could not load the help center.</p><button onClick={() => void query.refetch()}>Try again</button></div>;
  const labels = { ACCOUNT_TRANSFERS: categories[0], PAYMENTS_AUTOPAY: categories[1], TAX_STATEMENTS: categories[2], HARDSHIP: categories[3] };
  return <HelpCenterContent faqs={query.data.items.map(item => ({ category: labels[item.category], question: item.question, answer: item.answerMarkdown }))} />;
}
function HelpCenterContent({ faqs }: { faqs: typeof fallbackFaqs }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [active, setActive] = useState<Category | "All Categories">("All Categories");
  const [open, setOpen] = useState<string | null>(faqs[0]?.question ?? null);

  const visibleFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return faqs.filter((faq) => (active === "All Categories" || faq.category === active) && (!term || `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(term)));
  }, [active, query, faqs]);

  const visibleCategories = categories.filter((category) => category.toLowerCase().includes(categoryQuery.trim().toLowerCase()));

  return (
    <>
      <section className={`${siteShell} tw:relative tw:mt-8 tw:overflow-hidden tw:rounded-3xl tw:bg-[#e7f5e7] tw:bg-[url('/help-center/hero-bg-desktop.webp')] tw:bg-cover tw:bg-center tw:bg-no-repeat tw:px-16 tw:py-[100px] tw:text-center tw:max-site-tablet:bg-[url('/help-center/hero-bg-tablet.webp')] tw:max-site-tablet:bg-bottom-right tw:max-site-tablet:px-8 tw:max-site-tablet:py-[72px] tw:max-site-mobile:mt-2 tw:max-site-mobile:rounded-[18px] tw:max-site-mobile:px-5 tw:max-site-mobile:py-12 tw:max-site-phone:bg-[url('/help-center/hero-bg-mobile.webp')]`} aria-labelledby="hc-title">
        <div className="tw:relative tw:z-1 tw:mx-auto tw:max-w-[760px]">
          <span className={siteBadge}>Help Center &amp; FAQs</span>
          <h1 id="hc-title" className="tw:m-0 tw:mt-7 tw:text-[54px] tw:leading-[1.15] tw:font-medium tw:tracking-[-.02em] tw:max-site-laptop:text-5xl tw:max-site-tablet:text-[42px] tw:max-site-mobile:text-[clamp(28px,8.7vw,34px)]">How Can We <span className="tw:text-site-green">Help You?</span></h1>
          <p className="tw:m-0 tw:mt-5 tw:text-xl tw:font-medium tw:max-site-tablet:mt-3.5 tw:max-site-mobile:mt-2.5 tw:max-site-mobile:text-base">Search our knowledgebase or pick a topic category below to find instant answers:</p>
          <label className="tw:relative tw:mx-auto tw:mt-7 tw:block tw:max-w-[724px]">
            <span className="tw:sr-only">Search the help center</span>
            <input className="tw:h-[60px] tw:w-full tw:rounded-xl tw:border tw:border-solid tw:border-[#9aa8b0] tw:bg-white tw:py-0 tw:pr-[60px] tw:pl-8 tw:text-site-ink tw:text-base tw:transition-shadow tw:placeholder:text-[#52657e] tw:focus:border-site-blue tw:focus:outline-none tw:focus:shadow-[0_0_0_4px_#00649e1f] tw:max-site-mobile:h-[54px] tw:max-site-mobile:pr-[46px] tw:max-site-mobile:pl-4 tw:max-site-mobile:text-[15px]" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. AutoPay, Form 1098" aria-controls={listId} />
            <SearchIcon />
          </label>
        </div>
      </section>

      <section className={`${siteShell} ${sectionSpacing} tw:grid tw:grid-cols-[396px_minmax(0,1fr)] tw:items-start tw:gap-12 tw:max-site-laptop:grid-cols-[320px_minmax(0,1fr)] tw:max-site-laptop:gap-10 tw:max-site-tablet:grid-cols-1 tw:max-site-tablet:gap-7 tw:max-site-mobile:gap-[22px]`} aria-label="Frequently asked questions">
        <aside className="tw:self-stretch tw:rounded-[14px] tw:bg-[#eef6fd] tw:px-[26px] tw:py-9 tw:max-site-tablet:bg-transparent tw:max-site-tablet:p-0">
          <h2 className="tw:m-0 tw:text-2xl tw:leading-[1.3] tw:font-medium tw:max-site-mobile:text-xl">Browse Categories</h2>

          <div className="tw:sticky tw:top-[120px] tw:max-site-tablet:hidden">
            <input className="tw:mt-7 tw:h-[60px] tw:w-full tw:rounded-lg tw:border tw:border-solid tw:border-[#a9b6bd] tw:bg-white tw:px-5 tw:py-0 tw:text-site-ink tw:text-[15px] tw:placeholder:text-[#52657e] tw:focus:border-site-blue tw:focus-visible:outline-3 tw:focus-visible:outline-[#7cc4ef]" type="search" value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Search Categories" aria-label="Search categories" />
            <div className="tw:mt-12 tw:grid tw:gap-3 tw:border-0 tw:border-t tw:border-solid tw:border-[#c9d6df] tw:pt-12">
              {(["All Categories", ...visibleCategories] as const).map((category) => (
                <button key={category} type="button" className={cn("tw:min-h-[58px] tw:cursor-pointer tw:rounded-lg tw:border tw:border-solid tw:border-[#a9b6bd] tw:bg-white tw:px-4 tw:py-2.5 tw:text-base tw:text-site-ink tw:transition-colors tw:hover:border-site-blue tw:hover:text-site-blue", active === category && "tw:border-site-blue tw:bg-site-blue tw:font-semibold tw:text-white tw:underline tw:underline-offset-4 tw:hover:text-white")} aria-pressed={active === category} onClick={() => { setActive(category); setOpen(null); }}>
                  {category}
                </button>
              ))}
              {visibleCategories.length === 0 ? <p className="tw:m-0 tw:text-center tw:text-sm tw:text-site-muted">No matching categories.</p> : null}
            </div>
          </div>

          <label className={cn(contactSelect, "tw:hidden tw:max-site-tablet:mt-4 tw:max-site-tablet:block")}>
            <span className="tw:sr-only">Category</span>
            <select className="tw:h-14 tw:w-full tw:cursor-pointer tw:appearance-none tw:rounded-[10px] tw:border tw:border-solid tw:border-[#a9b6bd] tw:bg-white tw:text-site-ink tw:pr-[52px] tw:pl-5 tw:text-base tw:focus:border-site-blue tw:focus-visible:outline-3 tw:focus-visible:outline-[#7cc4ef]" value={active} onChange={(event) => { setActive(event.target.value as Category | "All Categories"); setOpen(null); }}>
              <option>All Categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </aside>

        <div className="tw:min-w-0">
          <h2 className="tw:m-0 tw:text-[44px] tw:leading-[1.2] tw:font-medium tw:tracking-[-.02em] tw:max-site-tablet:text-4xl tw:max-site-mobile:text-[30px]">{active}</h2>
          <p className="tw:m-0 tw:mt-3.5 tw:text-[15px]" aria-live="polite">Showing {visibleFaqs.length} {visibleFaqs.length === 1 ? "answer" : "answers"}</p>

          <ul id={listId} className="tw:m-0 tw:mt-[30px] tw:list-none tw:p-0">
            {visibleFaqs.map((faq, index) => {
              const isOpen = open === faq.question;
              const panelId = `${listId}-panel-${index}`;
              return (
                <li key={faq.question} className={cn("tw:border-0 tw:border-b tw:border-solid tw:border-site-line tw:transition-colors", isOpen && "tw:rounded-t-2xl tw:border-b-2 tw:border-site-green tw:bg-site-green-soft")}>
                  <button type="button" className={cn("tw:group tw:grid tw:w-full tw:cursor-pointer tw:grid-cols-[minmax(0,1fr)_auto] tw:items-center tw:gap-x-6 tw:gap-y-3 tw:border-0 tw:bg-transparent tw:px-[42px] tw:pt-[27px] tw:pb-[26px] tw:text-left tw:text-site-ink tw:max-site-laptop:px-7 tw:max-site-mobile:gap-x-4 tw:max-site-mobile:gap-y-2.5 tw:max-site-mobile:px-4 tw:max-site-mobile:py-5", isOpen && "tw:pt-11 tw:pb-0 tw:max-site-mobile:pt-[22px] tw:max-site-mobile:pb-0")} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : faq.question)}>
                    <span className={cn("tw:col-start-1 tw:justify-self-start tw:rounded-md tw:border tw:border-solid tw:border-site-blue tw:bg-site-blue tw:px-3.5 tw:py-1.5 tw:text-[13px] tw:leading-[1.3] tw:text-white tw:max-site-mobile:px-2.5 tw:max-site-mobile:py-[5px] tw:max-site-mobile:text-xs", isOpen && "tw:border-site-line tw:bg-white tw:text-site-ink")}>{faq.category}</span>
                    <span className="tw:col-start-1 tw:text-[19px] tw:leading-[1.4] tw:font-medium tw:max-site-mobile:text-[17px]">{faq.question}</span>
                    <span className={cn("tw:col-start-2 tw:row-span-2 tw:row-start-1 tw:grid tw:size-[46px] tw:place-items-center tw:rounded-full tw:border-[1.5px] tw:border-solid tw:border-site-blue tw:bg-site-blue tw:text-white tw:transition-transform tw:group-hover:scale-106 tw:max-site-mobile:size-9", isOpen && "tw:border-site-ink tw:bg-white tw:text-site-ink")} aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 8h12" />{!isOpen ? <path d="M8 2v12" /> : null}</svg></span>
                  </button>
                  <div id={panelId} className="tw:px-[42px] tw:pt-3.5 tw:pb-12 tw:max-site-laptop:px-7 tw:max-site-mobile:px-4 tw:max-site-mobile:pt-3 tw:max-site-mobile:pb-6" hidden={!isOpen}>
                    <p className="tw:m-0 tw:max-w-[580px] tw:text-base tw:leading-[1.75] tw:max-site-mobile:text-[15px]">{faq.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {visibleFaqs.length === 0 ? (
            <p className="tw:m-0 tw:mt-8 tw:rounded-xl tw:bg-[#edf0f2] tw:p-6">No answers match your search. Try a different word, or <a className="tw:text-site-blue tw:underline" href={publicSiteInfo.phone.href}>call {publicSiteInfo.phone.label}</a>.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
