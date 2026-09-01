"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: "الربط والتثبيت",
    q: "كيف أقوم بربط متجري على سلة مع منصة TMTECH؟",
    a: "الربط بسيط جداً ويتم بضغطة زر واحدة! بعد تثبيت التطبيق من متجر تطبيقات سلة، سيتم توجيهك لمنح الصلاحيات اللازمة، وبعدها يصبح متجرك متصلاً وجاهزاً لاستيراد المنتجات فوراً دون أي إعدادات تقنية معقدة.",
  },
  {
    category: "الربط والتثبيت",
    q: "هل أحتاج لخبرة برمجية لاستخدام التطبيق؟",
    a: "لا على الإطلاق. تم تصميم TMTECH ليكون نظاماً مؤتمتاً بالكامل بواجهة عربية سهلة وبسيطة تناسب جميع التجار من المبتدئين وحتى أصحاب المتاجر الكبرى.",
  },
  {
    category: "المنتجات والمخزون",
    q: "كيف يعمل استيراد المنتجات بضغطة زر؟",
    a: "يمكنك تصفح آلاف المنتجات الرابحة والمختارة بعناية، وتحديد هامش الربح المطلوب، ثم الضغط على زر 'استيراد إلى سلة'. سيقوم النظام بنقل الصور المترجمة، الوصف، الخيارات (الألوان والمقاسات)، وتحديث المخزون مباشرة في متجرك.",
  },
  {
    category: "المنتجات والمخزون",
    q: "هل يتم تحديث الأسعار والمخزون تلقائياً؟",
    a: "نعم، يقوم النظام بمراقبة مستويات المخزون والأسعار لدى الموردين وتحديث متجرك في سلة بصورة دورية لمنع بيع أي منتج غير متوفر أو تغير في سعر التكلفة.",
  },
  {
    category: "الطلبات والشحن",
    q: "كيف تتم معالجة وتلبية الطلبات بعد الشراء؟",
    a: "بمجرد قيام العميل بالدفع في متجرك على سلة، يتم إرسال إشعار تلقائي (Webhook) لمنصتنا لسحب بيانات الطلب وعنوان العميل، ويتم تنفيذ الطلب لدى المورد تلقائياً وخصم التكلفة من محفظتك.",
  },
  {
    category: "الطلبات والشحن",
    q: "كيف يحصل العميل على رقم تتبع الشحنة؟",
    a: "فور قيام المورد بشحن المنتج وتوليد رقم التتبع، يقوم نظام TMTECH بتحديث حالة الطلب في متجرك على سلة إلى 'تم الشحن' وإرفاق رقم التتبع ورابط شركة الشحن ليصل إشعار SMS/إيميل للعميل تلقائياً.",
  },
  {
    category: "المحفظة والمالية",
    q: "كيف تعمل محفظة TMTECH؟",
    a: "المحفظة هي حسابك المالي المخصص لدفع تكاليف شراء المنتجات بالجملة ورسوم الشحن للموردين. يمكنك شحن رصيد المحفظة باستخدام بطاقات مدى، البطاقات الائتمانية، أو التحويل البنكي بسهولة وأمان.",
  },
  {
    category: "الدعم والمساعدة",
    q: "كيف يمكنني الحصول على المساعدة إذا واجهت مشكلة؟",
    a: "فريق الدعم الفني لدينا متاح لخدمتك عبر البريد الإلكتروني (support@tmtech.sa) والمحادثة المباشرة وتذاكر الدعم في لوحة التحكم لحل أي استفسار أو مشكلة تقنية بأسرع وقت.",
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [activeCat, setActiveCat] = useState<string>("الكل");

  const categories = ["الكل", "الربط والتثبيت", "المنتجات والمخزون", "الطلبات والشحن", "المحفظة والمالية", "الدعم والمساعدة"];

  const filteredFaqs = activeCat === "الكل" 
    ? FAQS 
    : FAQS.filter(item => item.category === activeCat);

  return (
    <main dir="rtl" className="min-h-screen bg-bg text-text selection:bg-accent selection:text-accent-on">
      {/* Navbar */}
      <nav className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-sm border-b border-border-subtle">
        <div className="flex justify-between items-center px-6 md:px-12 py-3 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/tmtech-logo.png" alt="TMTECH" width={200} height={60} className="h-12 w-auto object-contain" priority />
            <span className="text-2xl font-bold text-text tracking-tight font-mono">TMTECH</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm text-text-secondary hover:text-text px-3 py-2 transition-colors">
              الرئيسية
            </Link>
            <Button size="sm">
              <Link href="/auth/login">دخول المنصة</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="py-16 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-semibold mb-4">
          <Icon name="help_outline" className="text-sm" />
          <span>مركز المساعدة والمعرفة</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-text tracking-tight">
          الأسئلة الشائعة وإرشادات الاستخدام
        </h1>
        <p className="text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          إليك إجابات شاملة عن كل ما يخص ربط متجرك في سلة، إدارة المنتجات، أتمتة الطلبات، والشحن عبر TMTECH.
        </p>
      </header>

      {/* Category Pills */}
      <div className="px-6 max-w-4xl mx-auto flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCat(cat);
              setOpenIdx(null);
            }}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
              activeCat === cat
                ? "bg-accent text-accent-on shadow-sm"
                : "bg-surface border border-border-subtle text-text-secondary hover:text-text hover:bg-surface-sunken"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      <section className="pb-24 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="space-y-4">
          {filteredFaqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <Card
                key={faq.q}
                className="overflow-hidden border border-border-subtle transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full p-6 text-right flex items-center justify-between gap-4 font-semibold text-text text-base md:text-lg hover:bg-surface-sunken transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block"></span>
                    {faq.q}
                  </span>
                  <Icon
                    name={isOpen ? "expand_less" : "expand_more"}
                    className="text-text-muted text-2xl shrink-0"
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-text-secondary text-sm md:text-base leading-7 bg-surface-sunken/40 border-t border-border-subtle">
                    {faq.a}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Support CTA Box */}
        <div className="mt-14 p-8 rounded-2xl bg-surface border border-border-subtle text-center">
          <h3 className="text-lg font-bold text-text mb-2">هل لديك استفسار آخر لم تجد إجابته؟</h3>
          <p className="text-sm text-text-secondary mb-6">فريق خدمة العملاء متواجد على مدار الساعة لمساعدتك في إطلاق متجرك بنجاح.</p>
          <a
            href="mailto:support@tmtech.sa"
            className="inline-flex items-center gap-2 bg-accent text-accent-on px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Icon name="mail" className="text-base" />
            تواصل مع الدعم الفني (support@tmtech.sa)
          </a>
        </div>
      </section>
    </main>
  );
}
