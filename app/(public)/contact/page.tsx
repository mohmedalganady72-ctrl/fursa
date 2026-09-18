import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/features/contact/components/contact-form";

export const metadata = { title: "تواصل معنا" };

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return <main className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20 lg:px-8">
    <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
      <div><p className="text-body-sm font-semibold text-primary-600">نحن هنا لمساعدتك</p><h1 className="mt-3 font-heading text-4xl font-bold text-neutral-900 md:text-5xl">تواصل مع فريق فٌرص</h1><p className="mt-5 text-body-lg leading-8 text-secondary">سواء كنت باحثًا عن فٌرصة أو تمثل جهة، شاركنا سؤالك وسنوجّهك إلى الخطوة المناسبة.</p>
        <div className="mt-9 space-y-5"><ContactPoint icon={Mail} title="البريد الإلكتروني" value={contactEmail ?? "سيُضاف البريد الرسمي قريبًا"} /><ContactPoint icon={MessageCircle} title="وقت الاستجابة" value="خلال يومي عمل" /><ContactPoint icon={ShieldCheck} title="خصوصيتك" value="نستخدم بيانات الرسالة للرد عليك فقط" /></div>
      </div>
      <div className="rounded-md border border-neutral-200 bg-surface p-6 shadow-sm md:p-8"><h2 className="text-h3 text-neutral-900">أرسل رسالتك</h2><p className="mb-6 mt-2 text-body-sm text-secondary">اكتب التفاصيل التي تساعدنا على فهم طلبك بدقة.</p><ContactForm contactEmail={contactEmail} /></div>
    </div>
  </main>;
}

function ContactPoint({ icon: Icon, title, value }: { icon: typeof Mail; title: string; value: string }) { return <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700"><Icon className="h-5 w-5" /></span><div><p className="font-medium text-neutral-800">{title}</p><p className="text-body-sm text-secondary">{value}</p></div></div>; }
