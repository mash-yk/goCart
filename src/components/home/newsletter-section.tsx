import { NewsletterForm } from "./newsletter-form";

export function NewsletterSection() {
  return (
    <section className="container">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1E1E1E] px-6 py-12 text-white sm:px-12 sm:py-16 border border-black/15 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[36px] border-[#FDC841]/10" aria-hidden />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-[#FDC841]/10 blur-2xl" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-white">Get 10% off your first order.</h2>
            <p className="mt-3 max-w-md text-[#CDC4B3]">
              Join the Lumora list for early drops, member-only deals and the occasional very good playlist. No spam, ever.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
