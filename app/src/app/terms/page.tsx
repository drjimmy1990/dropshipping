"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";

export default function TermsOfServicePage() {
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

      {/* Header */}
      <header className="py-16 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-semibold mb-4">
          <Icon name="gavel" className="text-sm" />
          <span>الشروط والأحكام والاتفاقية</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-text tracking-tight">
          شروط وأحكام الاستخدام
        </h1>
        <p className="text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          تحكم هذه الاتفاقية استخدامك لمنصة وتطبيق <strong>TMTECH</strong> لربط المتاجر الإلكترونية وأتمتة الدروب شيبينج.
        </p>
        <p className="text-xs text-text-muted mt-2">آخر تحديث: سبتمبر 2026</p>
      </header>

      {/* Content */}
      <section className="pb-24 px-6 md:px-12 max-w-4xl mx-auto">
        <Card className="p-8 md:p-12 space-y-10 leading-relaxed shadow-sm border border-border-subtle bg-surface">
          <div>
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">1</span>
              قبول الشروط والترخيص
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7">
              بتثبيت تطبيق TMTECH من متجر تطبيقات سلة أو إنشاء حساب في المنصة، فإنك تقر وتوافق على الالتزام بجميع بنود هذه الاتفاقية والأنظمة التجارية المعمول بها في المملكة العربية السعودية.
            </p>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">2</span>
              مسؤوليات التاجر
            </h2>
            <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm md:text-base leading-7">
              <li>الالتزام بأن تكون المنتجات المستوردة متوافقة مع القوانين والأنظمة السعودية وغير محظورة.</li>
              <li>تحديد الأسعار وسياسات الإرجاع والاستبدال لعملاء المتجر بوضوح.</li>
              <li>الحفاظ على سرية بيانات تسجيل الدخول وعدم مشاركة الحساب مع أطراف غير مصرح لها.</li>
              <li>التأكد من كفاية الرصيد في المحفظة لتنفيذ الطلبات الواردة في الوقت المحدد.</li>
            </ul>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">3</span>
              المحفظة المالية والمدفوعات
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7">
              يتم استخدام رصيد المحفظة لشراء المنتجات وسداد تكاليف الشحن الدولي والمحلي للموردين. جميع المعاملات موثقة بسجلات مالية فورية داخل لوحة التحكم لضمان أعلى مستويات الشفافية.
            </p>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">4</span>
              إخلاء المسؤولية ومحددات الخدمة
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7">
              تبذل TMTECH أقصى جهدها لضمان استقرار الخدمة ومزامنة البيانات في الوقت الفعلي. تخضع أوقات التوصيل وظروف الشحن لسياسات شركات الشحن والموردين الدوليين.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}
