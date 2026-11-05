import { NewsletterForm } from "./newsletter-form";

export function NewsletterSection() {
  return (
    <section className="container">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient bg-[length:200%_200%] px-6 py-12 text-white animate-gradient-x sm:px-12 sm:py-16">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[40px] border-white/10" aria-hidden />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Get 10% off your first order.</h2>
            <p className="mt-3 max-w-md text-white/85">
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
