"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";

export default function PrivacyPolicyPage() {
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
          <Icon name="verified_user" className="text-sm" />
          <span>حماية البيانات والخصوصية</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-text tracking-tight">
          سياسة الخصوصية وسرية المعلومات
        </h1>
        <p className="text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          نلتزم في منصة <strong className="text-text">TMTECH (تم تك)</strong> بأعلى معايير الأمان وحماية بيانات المتاجر الإلكترونية وعملائهم وفقاً للأنظمة واللوائح المعتمدة لحماية البيانات الشخصية في المملكة العربية السعودية.
        </p>
        <p className="text-xs text-text-muted mt-2">آخر تحديث: سبتمبر 2026</p>
      </header>

      {/* Content */}
      <section className="pb-24 px-6 md:px-12 max-w-4xl mx-auto">
        <Card className="p-8 md:p-12 space-y-10 leading-relaxed shadow-sm border border-border-subtle bg-surface">
          
          <div>
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">1</span>
              مقدمة ونطاق العمل
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7">
              توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية البيانات والمعلومات عند تثبيت واستخدام تطبيق <strong>TMTECH</strong> عبر متجر تطبيقات سلة (Salla App Store) أو منصات التجارة الإلكترونية الشريكة. باستخدامك للتطبيق، فإنك توافق على الممارسات الموضحة في هذه الوثيقة.
            </p>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">2</span>
              البيانات التي نقوم بجمعها ومعالجتها
            </h2>
            <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm md:text-base leading-7">
              <li><strong>بيانات المتجر والتاجر:</strong> معرف المتجر (Store ID)، اسم المتجر، البريد الإلكتروني، ورابط المتجر للتحقق من الاتصال عبر OAuth.</li>
              <li><strong>بيانات المنتجات:</strong> العناوين، الأوصاف، الصور، الأسعار، ومستويات المخزون لتحديثها ومزامنتها بين الموردين ومتجر سلة.</li>
              <li><strong>بيانات تنفيذ الطلبات:</strong> أرقام الطلبات، تفاصيل المنتجات المطلوبة، اسم العميل، عنوان الشحن، ورقم التواصل لمعالجة وإتمام الشحن التلقائي لدى المورد.</li>
              <li><strong>بيانات المحفظة والمعاملات:</strong> سجل العمليات المالية ورصيد المحفظة المخصص لدفع تكاليف المنتجات للموردين.</li>
            </ul>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">3</span>
              كيفية استخدام البيانات
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7 mb-2">
              نستخدم البيانات المجمعة للأغراض التشغيلية التالية فقط:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm md:text-base leading-7">
              <li>مزامنة المنتجات وتحديث الأسعار والمخزون تلقائياً دون أي تأخير.</li>
              <li>معالجة طلبات المتجر وتوجيهها للموردين المناسبين (AliExpress / CJ) لتنفيذ الشحن.</li>
              <li>تحديث أرقام التتبع وإشعار التاجر بحالة الطلبات لحظة بلحظة.</li>
              <li>تقديم الدعم الفني وحل المشكلات التشغيلية وتحسين أداء المنصة.</li>
            </ul>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">4</span>
              أمن وحماية البيانات
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7">
              نطبق أعلى التدابير الأمنية والتقنية بما في ذلك التشفير الكامل (TLS/SSL و AES-256) لحماية رموز الربط البرمجي (OAuth Access Tokens) والبيانات الحساسة. كما نلتزم بعدم بيع أو تأجير أو مشاركة أي بيانات تخص المتجر أو عملائه مع أي طرف ثالث لأغراض إعلانية.
            </p>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">5</span>
              حقوق التاجر وإلغاء الربط وحذف البيانات
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7">
              يحق للتاجر في أي وقت إلغاء تثبيت التطبيق من لوحة تحكم سلة، مما يؤدي فوراً إلى تعطيل وصول التطبيق لبيانات المتجر. كما يمكن للتاجر طلب حذف كامل بياناته وسجلاته عبر التواصل مع فريق الدعم الفني.
            </p>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-sm font-bold">6</span>
              التواصل والدعم الفني
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-7">
              إذا كان لديك أي استفسار حول سياسة الخصوصية أو معالجة البيانات، يسعدنا تواصلك معنا:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-surface-sunken border border-border-subtle flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <p className="font-semibold text-text text-sm">فريق حماية البيانات والدعم الفني</p>
                <p className="text-xs text-text-secondary mt-1 font-mono">support@tmtech.sa</p>
              </div>
              <a href="mailto:support@tmtech.sa" className="text-xs font-semibold text-accent hover:underline">
                إرسال بريد إلكتروني &larr;
              </a>
            </div>
          </div>

        </Card>
      </section>
    </main>
  );
}
