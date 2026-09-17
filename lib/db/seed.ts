import { config } from "dotenv";
config({ path: ".env.local" }); // تحميل صريح — راجع نفس الملاحظة في lib/db/migrate.ts

import { db } from "./index";
import { auth } from "@/lib/auth/config";
import {
  fields,
  users,
  applicantProfiles,
  applicantFields,
  organizationProfiles,
  organizationJoinRequests,
  admins,
  opportunities,
  opportunityFields,
  applications,
  applicationStatusHistory,
} from "./schema";
import { eq } from "drizzle-orm";

/**
 * بيانات أولية شاملة للتطوير المحلي — يُشغَّل عبر `npm run db:seed`.
 * ينشئ: قائمة المجالات + 3 حسابات تجريبية (باحث/جهة/مدير) بكلمات مرور معروفة +
 * فرصتين وتقديمًا واحدًا، حتى يقدر أي مطور يسجّل دخول فورًا ويرى بيانات حقيقية
 * في كل لوحة دون الحاجة لتسجيل يدوي أو المرور بخطوة التحقق من البريد.
 *
 * تحذير: هذا السكربت مخصص للتطوير المحلي فقط. لا تُشغِّله أبدًا على بيئة إنتاج،
 * لأنه يُنشئ حسابات بكلمات مرور معروفة علنًا في هذا الملف.
 */

const TEST_PASSWORD = "Test@12345";

const initialFields = [
  "تطوير البرمجيات",
  "تصميم الجرافيك وتجربة المستخدم",
  "التسويق الرقمي",
  "المحاسبة والمالية",
  "الموارد البشرية",
  "الهندسة المدنية",
  "الهندسة الكهربائية",
  "الطب والرعاية الصحية",
  "التعليم والتدريب",
  "خدمة العملاء",
  "المبيعات",
  "إدارة الأعمال",
  "الشبكات وأمن المعلومات",
  "الترجمة واللغات",
  "الإعلام والصحافة",
  "القانون",
  "الزراعة والبيئة",
  "الخدمة الاجتماعية والعمل التطوعي",
  "اللوجستيات وسلاسل الإمداد",
  "الضيافة والسياحة",
];

async function seedFields() {
  console.log("→ إضافة قائمة المجالات...");
  await db.insert(fields).values(initialFields.map((nameAr) => ({ nameAr }))).onConflictDoNothing();
  const allFields = await db.query.fields.findMany();
  console.log(`  تم (${allFields.length} مجالًا)`);
  return allFields;
}

/**
 * ينشئ مستخدمًا عبر Better Auth API الفعلي (وليس إدراج SQL مباشر) حتى يُخزَّن
 * هاش كلمة المرور بشكل صحيح في جدول account الخاص بـ Better Auth، ثم يُفعِّل
 * الحساب يدويًا (emailVerified + isActive) لتخطي خطوة كود التحقق أثناء التطوير المحلي فقط.
 */
async function createSeedUser(email: string, role: "applicant" | "organization" | "admin") {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    console.log(`  المستخدم ${email} موجود مسبقًا، تخطّي الإنشاء`);
    return existing;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password: TEST_PASSWORD, name: email.split("@")[0], role } as any,
  });

  await db
    .update(users)
    .set({ emailVerified: true, isActive: true })
    .where(eq(users.id, result.user.id));

  return db.query.users.findFirst({ where: eq(users.id, result.user.id) });
}

async function seedApplicant(fieldIds: string[]) {
  console.log("→ إنشاء حساب الباحث التجريبي...");
  const user = await createSeedUser("applicant@test.com", "applicant");
  if (!user) throw new Error("فشل إنشاء حساب الباحث");

  const existingProfile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, user.id),
  });
  if (existingProfile) {
    console.log("  الملف الشخصي موجود مسبقًا، تخطّي");
    return existingProfile;
  }

  const [profile] = await db
    .insert(applicantProfiles)
    .values({
      userId: user.id,
      fullName: "أحمد الشرعبي",
      city: "صنعاء",
      bio: "خريج هندسة تقنية معلومات، مهتم بتطوير الويب والذكاء الاصطناعي.",
      gender: "male",
      qualification: "بكالوريوس",
      university: "جامعة تعز",
      specialization: "هندسة تقنية المعلومات",
      academicLevel: "خريج",
      skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
      experiences: ["متدرب مطوّر واجهات أمامية لمدة 6 أشهر في شركة محلية"],
      certifications: ["دورة تطوير الويب الحديث — منصة تعليمية عربية"],
      languages: ["العربية", "الإنجليزية"],
      githubUrl: "https://github.com/example-applicant",
    })
    .returning();

  if (!profile) throw new Error("فشل إنشاء الملف الشخصي للباحث");

  await db.insert(applicantFields).values(
    fieldIds.slice(0, 2).map((fieldId) => ({ applicantProfileId: profile.id, fieldId }))
  );

  console.log(`  تم إنشاء الملف الشخصي (${profile.fullName})`);
  return profile;
}

async function seedOrganization() {
  console.log("→ إنشاء حساب الجهة التجريبية (معتمدة مسبقًا للتطوير المحلي)...");
  const user = await createSeedUser("organization@test.com", "organization");
  if (!user) throw new Error("فشل إنشاء حساب الجهة");

  const existingProfile = await db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.userId, user.id),
  });
  if (existingProfile) {
    console.log("  ملف الجهة موجود مسبقًا، تخطّي");
    return existingProfile;
  }

  const [profile] = await db
    .insert(organizationProfiles)
    .values({
      userId: user.id,
      name: "شركة تقنية الغد",
      organizationType: "company",
      city: "صنعاء",
      activityDescription: "شركة برمجيات متخصصة في حلول الويب والموبايل.",
      // مُعتمَدة مباشرة هنا (isApproved: true) لتخطّي انتظار موافقة المدير أثناء التطوير المحلي فقط —
      // في المسار الحقيقي عبر الواجهة، هذا الحقل يبقى false حتى يعتمدها المدير يدويًا
      isApproved: true,
      approvedAt: new Date(),
    })
    .returning();

  if (!profile) throw new Error("فشل إنشاء ملف الجهة");

  await db.insert(organizationJoinRequests).values({
    organizationProfileId: profile.id,
    status: "approved",
    resolvedAt: new Date(),
  });

  console.log(`  تم إنشاء ملف الجهة (${profile.name})`);
  return profile;
}

async function seedAdmin() {
  console.log("→ إنشاء حساب المدير التجريبي...");
  const user = await createSeedUser("admin@test.com", "admin");
  if (!user) throw new Error("فشل إنشاء حساب المدير");

  const existingAdmin = await db.query.admins.findFirst({ where: eq(admins.userId, user.id) });
  if (existingAdmin) {
    console.log("  سجل المدير موجود مسبقًا، تخطّي");
    return existingAdmin;
  }

  const [admin] = await db
    .insert(admins)
    .values({ userId: user.id, displayName: "مدير المنصة" })
    .returning();

  if (!admin) throw new Error("فشل إنشاء سجل المدير");

  console.log("  تم إنشاء حساب المدير");
  return admin;
}

async function seedOpportunities(organizationProfileId: string, fieldIds: string[]) {
  console.log("→ إنشاء فرص تجريبية...");

  const existingJobs = await db.query.opportunities.findMany({
    where: eq(opportunities.organizationProfileId, organizationProfileId),
  });
  if (existingJobs.length > 0) {
    console.log("  توجد فرص مسبقًا لهذه الجهة، تخطّي الإنشاء");
    return existingJobs;
  }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  const [job] = await db
    .insert(opportunities)
    .values({
      organizationProfileId,
      type: "job",
      title: "مطوّر واجهات أمامية (Frontend Developer)",
      description:
        "نبحث عن مطوّر واجهات أمامية للانضمام لفريقنا، للعمل على منتجات ويب حديثة باستخدام React وNext.js.",
      workMode: "hybrid",
      city: "صنعاء",
      seatsAvailable: 2,
      applicationDeadline: deadline,
      requiredQualification: "بكالوريوس",
      requiredSkills: "React,TypeScript,Tailwind CSS",
      minimumYearsExperience: 1,
      publishedAt: new Date(),
    })
    .returning();

  if (!job) throw new Error("فشل إنشاء فرصة العمل التجريبية");

  await db.insert(opportunityFields).values(
    fieldIds.slice(0, 1).map((fieldId) => ({ opportunityId: job.id, fieldId }))
  );

  const [volunteering] = await db
    .insert(opportunities)
    .values({
      organizationProfileId,
      type: "volunteering",
      title: "متطوع في حملة توعوية مجتمعية",
      description: "فرصة تطوعية للمساهمة في حملة توعية مجتمعية حول استخدام التقنية بأمان.",
      workMode: "on_site",
      city: "صنعاء",
      seatsAvailable: 5,
      applicationDeadline: deadline,
      requiresResume: "false",
      publishedAt: new Date(),
    })
    .returning();

  if (!volunteering) throw new Error("فشل إنشاء فرصة التطوع التجريبية");

  console.log(`  تم إنشاء فرصتين: "${job.title}" و"${volunteering.title}"`);
  return [job, volunteering];
}

async function seedSampleApplication(applicantProfileId: string, opportunityId: string) {
  console.log("→ إنشاء تقديم تجريبي...");

  const existing = await db.query.applications.findFirst({
    where: eq(applications.opportunityId, opportunityId),
  });
  if (existing) {
    console.log("  يوجد تقديم مسبقًا، تخطّي");
    return existing;
  }

  const [application] = await db
    .insert(applications)
    .values({
      opportunityId,
      applicantProfileId,
      status: "applied",
      whySuitableText:
        "لدي شغف كبير بتطوير الواجهات الأمامية وخبرة عملية بـ React، وأرى في هذه الفرصة بيئة مناسبة لتطوير مهاراتي والمساهمة الفعلية في نجاح الفريق.",
      resumeUrl: "https://example.com/sample-resume.pdf",
      compatibilityScore: 78,
      compatibilityBreakdown: JSON.stringify({
        fieldAndSpecialization: 0.8,
        requiredSkills: 0.9,
        experience: 0.7,
        cvExtractedInfo: 1,
        qualification: 1,
        city: 1,
      }),
    })
    .returning();

  if (!application) throw new Error("فشل إنشاء التقديم التجريبي");

  await db.insert(applicationStatusHistory).values({
    applicationId: application.id,
    oldStatus: null,
    newStatus: "applied",
  });

  console.log("  تم إنشاء تقديم تجريبي بدرجة توافق 78%");
  return application;
}

async function main() {
  console.log("بدء تشغيل البيانات التجريبية...\n");

  const allFields = await seedFields();
  const fieldIds = allFields.map((f) => f.id);

  const applicantProfile = await seedApplicant(fieldIds);
  const organizationProfile = await seedOrganization();
  await seedAdmin();

  if (organizationProfile) {
    const opps = await seedOpportunities(organizationProfile.id, fieldIds);
    if (applicantProfile && opps[0]) {
      await seedSampleApplication(applicantProfile.id, opps[0].id);
    }
  }

  console.log("\n✅ اكتملت البيانات التجريبية بنجاح.\n");
  console.log("حسابات الدخول التجريبية (كلمة المرور للجميع: Test@12345):");
  console.log("  باحث   → applicant@test.com");
  console.log("  جهة    → organization@test.com   (رابط: /login)");
  console.log("  مدير   → admin@test.com          (رابط: /admin-login)");

  process.exit(0);
}

main().catch((error) => {
  console.error("فشل تشغيل البيانات التجريبية:", error);
  process.exit(1);
});
