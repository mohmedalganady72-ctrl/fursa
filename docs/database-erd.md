# مخطط قاعدة البيانات (ERD)

مصدر الحقيقة الفعلي لكل جدول وعمود وعلاقة هو ملفات Drizzle schema في `lib/db/schema/*.ts` — هذا الملف مرجع سردي سريع لفهم العلاقات دون فتح كل ملف.

## الكيانات والعلاقات الرئيسية

```
users (1) ──┬── (1) applicant_profiles ──(N)── applicant_fields ──(N)── fields
            ├── (1) organization_profiles ──(1)── organization_join_requests
            └── (1) admins ──(N)── admin_audit_log

organization_profiles (1) ──(N)── opportunities ──(N)── opportunity_fields ──(N)── fields

applicant_profiles (1) ──(N)── applications ──(N)── (1) opportunities
applications (1) ──(N)── application_status_history

applicant_profiles (1) ──(N)── saved_opportunities ──(N)── (1) opportunities
applicant_profiles (1) ──(N)── saved_searches

applications (1) ──(1)── conversations ──(N)── messages ──(N)── (1) users [via sender_id]

users (1) ──(N)── notifications
users (1) ──(N)── reports [via reporter_id]

system_settings (جدول key-value مستقل، بلا علاقات — راجع الملاحظات أدناه)
```

## ملاحظات تصميمية رئيسية

- **جدول `opportunities` موحّد** لكل الأنواع الثلاثة (عمل/تطوع/تدريب تعاوني) بحقول خاصة قابلة للـ NULL حسب النوع — راجع تبرير هذا القرار في `lib/db/schema/opportunities.ts`. **لا تعديل بعد النشر**: أي "تغيير" فعليًا هو إغلاق (`status: closed`) + إنشاء صف جديد بالكامل، وليس UPDATE على الصف القائم — الصف القديم يبقى بلا حذف كسجل تاريخي.
- **`applications` موحّد** بنفس المنطق لحقول التقديم المختلفة حسب نوع الفرصة. عمود `compatibility_breakdown` يحفظ JSON لتفصيل كل معيار ووزنه وقت التقييم تحديدًا، وليس الأوزان الحالية في النظام — هذا يضمن أن شرح الدرجة لأي تقديم قديم يبقى دقيقًا حتى لو تغيّرت الأوزان الافتراضية لاحقًا.
- **`application_status_history`**: جدول append-only — لا تُحدَّث صفوفه أبدًا، فقط يُضاف صف جديد مع كل تغيير حالة. `changed_by_user_id` يكون NULL عند تغيير آلي بالكامل من النظام (مثال: إغلاق جماعي لتقديمات أخرى عند اكتمال المقاعد).
- **`conversations`** بعلاقة 1:1 صارمة مع `applications` (`uniqueIndex`) — لا محادثة بلا تقديم مقبول فعليًا.
- **`admin_audit_log`**: `target_id` بلا قيد مفتاح خارجي صارم (FK) عمدًا، لأنه يشير لجداول متعددة محتملة حسب نوع الإجراء (`target_type`) — التحقق من الاتساق يحدث في طبقة التطبيق وقت الكتابة، وليس على مستوى قاعدة البيانات.
- **`reports`**: نفس منطق `target_id`/`target_type` المرن أعلاه، يدعم التبليغ عن رسالة أو مستخدم أو فرصة بجدول واحد.
- **`system_settings`**: جدول key-value مستقل بلا أي علاقات — يُقرأ عبر `features/admin/services/system-settings.service.ts` بقيمة افتراضية تلقائية من `lib/constants.ts` إذا لم يوجد صف بعد، فلا حاجة لبيانات seed إضافية ليعمل النظام من أول تشغيل.
- كل الفهارس (indexes) الموثَّقة داخل ملفات الـ schema مبنية على أنماط الاستعلام الفعلية في `features/*/services/*.ts`.

راجع `docs/design-system.md` للهوية البصرية، و`README.md` § "النموذج المنطقي لقاعدة البيانات" للجدول السردي المختصر، و`docs/requirements-and-design.md` لجدول المراجعات الجوهرية الكاملة.
