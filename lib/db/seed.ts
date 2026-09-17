import { config } from "dotenv";
config({ path: ".env.local" });

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import {
  accounts,
  admins,
  applicantFields,
  applicantProfiles,
  applications,
  applicationStatusHistory,
  fields,
  opportunities,
  opportunityFields,
  organizationJoinRequests,
  organizationProfiles,
  users,
} from "./schema";

/** بيانات تطوير شبه واقعية. لا تشغّل هذا السكربت في بيئة الإنتاج. */
const TEST_PASSWORD = "Test@12345";

const initialFields = [
  "تطوير البرمجيات",
  "علوم البيانات والذكاء الاصطناعي",
  "الشبكات وأمن المعلومات",
  "تصميم تجربة المستخدم والواجهات",
  "تصميم الجرافيك",
  "الهندسة الكهربائية والإلكترونية",
  "الهندسة الميكانيكية والصناعية",
  "الهندسة المدنية والمعمارية",
  "الطاقة والاستدامة",
  "الطب والرعاية الصحية",
  "الصيدلة والعلوم الطبية",
  "العلوم الأساسية والبحث العلمي",
  "العلوم الإنسانية والاجتماعية",
  "علم النفس والإرشاد",
  "الخدمة الاجتماعية",
  "التربية والتعليم",
  "التربية الخاصة",
  "التعليم والتدريب",
  "الإدارة والقيادة",
  "إدارة الأعمال",
  "إدارة المشاريع",
  "الموارد البشرية",
  "المحاسبة والمالية",
  "الاقتصاد والاستثمار",
  "القانون والأنظمة",
  "التسويق الرقمي",
  "الإعلام وصناعة المحتوى",
  "العلاقات العامة والاتصال المؤسسي",
  "المبيعات وتطوير الأعمال",
  "خدمة العملاء",
  "اللوجستيات وسلاسل الإمداد",
  "الجودة والتميز المؤسسي",
  "الترجمة واللغات",
  "الثقافة والفنون",
  "الضيافة والسياحة",
  "الزراعة والأمن الغذائي",
  "البيئة والاستدامة",
  "الخدمة الاجتماعية والعمل التطوعي",
  "الرياضة والصحة البدنية",
] as const;

type SeedRole = "applicant" | "organization" | "admin";

async function seedFields() {
  console.log("إضافة المجالات المرجعية...");
  await db.insert(fields).values(initialFields.map((nameAr) => ({ nameAr }))).onConflictDoNothing();
  const allFields = await db.query.fields.findMany();
  console.log(`  تم توفير ${allFields.length} مجالًا`);
  return allFields;
}

async function createSeedUser(email: string, role: SeedRole, name: string) {
  const password = await hashPassword(TEST_PASSWORD);
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    await db.update(users).set({
      name,
      role,
      emailVerified: true,
      isActive: true,
      updatedAt: new Date(),
    }).where(eq(users.id, existing.id));

    const credentialAccount = await db.query.accounts.findFirst({
      where: and(eq(accounts.userId, existing.id), eq(accounts.providerId, "credential")),
    });
    if (credentialAccount) {
      await db.update(accounts).set({ password, updatedAt: new Date() }).where(eq(accounts.id, credentialAccount.id));
    } else {
      await db.insert(accounts).values({
        userId: existing.id,
        accountId: existing.id,
        providerId: "credential",
        password,
      });
    }
    return { ...existing, name, role, emailVerified: true, isActive: true };
  }

  const [created] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(users).values({
      email,
      name,
      role,
      emailVerified: true,
      isActive: true,
    }).returning();
    const user = inserted[0];
    if (!user) throw new Error("فشل إنشاء مستخدم البيانات الأولية");
    await tx.insert(accounts).values({
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password,
    });
    return inserted;
  });

  if (!created) throw new Error("فشل إنشاء مستخدم البيانات الأولية");
  return created;
}

async function seedApplicant(fieldIdsByName: Map<string, string>) {
  console.log("إعداد حساب الباحث التجريبي...");
  const user = await createSeedUser("applicant@test.com", "applicant", "نورة القحطاني");
  const profileData = {
    fullName: "نورة عبدالله القحطاني",
    city: "الرياض",
    bio: "خريجة علوم حاسب مهتمة ببناء المنتجات الرقمية وتحليل البيانات، وأسعى إلى فرصة أطور فيها خبرتي ضمن فريق احترافي.",
    gender: "female" as const,
    qualification: "بكالوريوس",
    university: "جامعة الملك سعود",
    specialization: "علوم الحاسب",
    academicLevel: "خريجة",
    skills: ["React", "TypeScript", "تحليل البيانات", "التواصل والعمل الجماعي"],
    experiences: ["متدربة تطوير منتجات رقمية لمدة ستة أشهر في شركة تقنية ناشئة"],
    certifications: ["أساسيات تحليل البيانات", "تطوير تطبيقات الويب الحديثة"],
    languages: ["العربية", "الإنجليزية"],
    githubUrl: "https://github.com/fursa-demo-applicant",
    updatedAt: new Date(),
  };
  const existing = await db.query.applicantProfiles.findFirst({ where: eq(applicantProfiles.userId, user.id) });
  const profile = existing
    ? (await db.update(applicantProfiles).set(profileData).where(eq(applicantProfiles.id, existing.id)).returning())[0]
    : (await db.insert(applicantProfiles).values({ userId: user.id, ...profileData }).returning())[0];
  if (!profile) throw new Error("فشل إعداد ملف الباحث");

  await db.delete(applicantFields).where(eq(applicantFields.applicantProfileId, profile.id));
  const selectedNames = ["تطوير البرمجيات", "علوم البيانات والذكاء الاصطناعي", "تصميم تجربة المستخدم والواجهات"];
  const selectedIds = selectedNames.map((name) => fieldIdsByName.get(name)).filter((id): id is string => Boolean(id));
  if (selectedIds.length) {
    await db.insert(applicantFields).values(selectedIds.map((fieldId) => ({ applicantProfileId: profile.id, fieldId })));
  }
  return profile;
}

type OrganizationSeed = {
  email: string;
  name: string;
  type: "company" | "nonprofit" | "academic" | "government";
  city: string;
  description: string;
};

async function seedOrganization(data: OrganizationSeed) {
  const user = await createSeedUser(data.email, "organization", data.name);
  const profileData = {
    name: data.name,
    organizationType: data.type,
    city: data.city,
    activityDescription: data.description,
    isApproved: true,
    approvedAt: new Date(),
    updatedAt: new Date(),
  };
  const existing = await db.query.organizationProfiles.findFirst({ where: eq(organizationProfiles.userId, user.id) });
  const profile = existing
    ? (await db.update(organizationProfiles).set(profileData).where(eq(organizationProfiles.id, existing.id)).returning())[0]
    : (await db.insert(organizationProfiles).values({ userId: user.id, ...profileData }).returning())[0];
  if (!profile) throw new Error(`فشل إعداد ملف الجهة: ${data.name}`);

  const request = await db.query.organizationJoinRequests.findFirst({
    where: eq(organizationJoinRequests.organizationProfileId, profile.id),
  });
  if (request) {
    await db.update(organizationJoinRequests).set({ status: "approved", resolvedAt: new Date() })
      .where(eq(organizationJoinRequests.id, request.id));
  } else {
    await db.insert(organizationJoinRequests).values({
      organizationProfileId: profile.id,
      status: "approved",
      resolvedAt: new Date(),
    });
  }
  return profile;
}

async function seedAdmin() {
  console.log("إعداد حساب مدير المنصة...");
  const user = await createSeedUser("admin@test.com", "admin", "سارة الحربي");
  const existing = await db.query.admins.findFirst({ where: eq(admins.userId, user.id) });
  if (existing) {
    const [updated] = await db.update(admins).set({ displayName: "سارة الحربي" }).where(eq(admins.id, existing.id)).returning();
    return updated;
  }
  const [created] = await db.insert(admins).values({ userId: user.id, displayName: "سارة الحربي" }).returning();
  return created;
}

type OpportunitySeed = {
  type: "job" | "volunteering" | "co_op";
  title: string;
  description: string;
  workMode: "on_site" | "remote" | "hybrid";
  city: string;
  seatsAvailable: number;
  fieldNames: string[];
  requiredQualification?: string;
  requiredSkills?: string;
  minimumYearsExperience?: number;
  requiredAcademicLevel?: string;
  requiresResume?: string;
};

async function ensureOpportunity(
  organizationProfileId: string,
  data: OpportunitySeed,
  fieldIdsByName: Map<string, string>,
) {
  const existing = (await db.query.opportunities.findMany({
    where: eq(opportunities.organizationProfileId, organizationProfileId),
  })).find((item) => item.title === data.title);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const values = {
    type: data.type,
    status: "published" as const,
    title: data.title,
    description: data.description,
    workMode: data.workMode,
    city: data.city,
    seatsAvailable: data.seatsAvailable,
    applicationDeadline: deadline,
    requiredQualification: data.requiredQualification,
    requiredSkills: data.requiredSkills,
    minimumYearsExperience: data.minimumYearsExperience,
    requiredAcademicLevel: data.requiredAcademicLevel,
    requiresResume: data.requiresResume,
    publishedAt: new Date(),
    closedAt: null,
    closureReason: null,
    updatedAt: new Date(),
  };
  const opportunity = existing
    ? (await db.update(opportunities).set(values).where(eq(opportunities.id, existing.id)).returning())[0]
    : (await db.insert(opportunities).values({ organizationProfileId, ...values }).returning())[0];
  if (!opportunity) throw new Error(`فشل إعداد الفرصة: ${data.title}`);

  await db.delete(opportunityFields).where(eq(opportunityFields.opportunityId, opportunity.id));
  const fieldIds = data.fieldNames.map((name) => fieldIdsByName.get(name)).filter((id): id is string => Boolean(id));
  if (fieldIds.length) {
    await db.insert(opportunityFields).values(fieldIds.map((fieldId) => ({ opportunityId: opportunity.id, fieldId })));
  }
  return opportunity;
}

async function archiveLegacyOpportunities(organizationProfileId: string) {
  const legacyTitles = new Set([
    "مطوّر واجهات أمامية (Frontend Developer)",
    "متطوع في حملة توعوية مجتمعية",
  ]);
  const organizationOpportunities = await db.query.opportunities.findMany({
    where: eq(opportunities.organizationProfileId, organizationProfileId),
  });
  for (const opportunity of organizationOpportunities) {
    if (!legacyTitles.has(opportunity.title)) continue;
    await db.update(opportunities).set({
      status: "closed",
      city: "الرياض",
      closedAt: new Date(),
      closureReason: "seed_data_replaced",
      updatedAt: new Date(),
    }).where(eq(opportunities.id, opportunity.id));
  }
}

async function seedSampleApplication(applicantProfileId: string, opportunityId: string) {
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.opportunityId, opportunityId), eq(applications.applicantProfileId, applicantProfileId)),
  });
  const values = {
    status: "applied" as const,
    whySuitableText: "طورت خلال تدريبي عدة واجهات باستخدام React وTypeScript، وأرغب في توظيف هذه الخبرة والمساهمة في تطوير منتج رقمي يخدم المستخدمين بوضوح وكفاءة.",
    compatibilityScore: 86,
    compatibilityBreakdown: JSON.stringify({
      fieldAndSpecialization: 0.9,
      requiredSkills: 0.9,
      experience: 0.75,
      cvExtractedInfo: 1,
      qualification: 1,
      city: 1,
    }),
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(applications).set(values).where(eq(applications.id, existing.id));
    return existing;
  }
  const [application] = await db.insert(applications).values({ opportunityId, applicantProfileId, ...values }).returning();
  if (!application) throw new Error("فشل إنشاء طلب التقديم التجريبي");
  await db.insert(applicationStatusHistory).values({ applicationId: application.id, oldStatus: null, newStatus: "applied" });
  return application;
}

async function main() {
  console.log("بدء إعداد بيانات العرض شبه الواقعية...\n");
  const allFields = await seedFields();
  const fieldIdsByName = new Map(allFields.map((field) => [field.nameAr, field.id]));
  const applicant = await seedApplicant(fieldIdsByName);

  console.log("إعداد الجهات التجريبية...");
  const [digital, impact, academy] = await Promise.all([
    seedOrganization({ email: "organization@test.com", name: "شركة آفاق الرقمية", type: "company", city: "الرياض", description: "شركة سعودية متخصصة في تطوير المنتجات الرقمية وحلول البيانات للقطاعات الناشئة." }),
    seedOrganization({ email: "careers@athar.example", name: "مؤسسة أثر المجتمعية", type: "nonprofit", city: "جدة", description: "مؤسسة غير ربحية تطور مبادرات تعليمية ومجتمعية مستدامة بالشراكة مع المتطوعين والجهات المحلية." }),
    seedOrganization({ email: "talent@masar.example", name: "أكاديمية مسار المستقبل", type: "academic", city: "الدمام", description: "جهة تدريبية تقدم برامج تطبيقية في التقنية والتعليم المهني وإعداد الخريجين لسوق العمل." }),
  ]);
  if (!digital || !impact || !academy) throw new Error("فشل إعداد الجهات التجريبية");
  await archiveLegacyOpportunities(digital.id);

  const opportunitySeeds: Array<[string, OpportunitySeed]> = [
    [digital.id, { type: "job", title: "مطوّر واجهات أمامية", city: "الرياض", workMode: "hybrid", seatsAvailable: 2, description: "نبحث عن مطوّر واجهات يشارك في بناء منتجات رقمية سريعة وسهلة الاستخدام ضمن فريق متعدد التخصصات.", fieldNames: ["تطوير البرمجيات", "تصميم تجربة المستخدم والواجهات"], requiredQualification: "بكالوريوس", requiredSkills: "React,TypeScript,Next.js", minimumYearsExperience: 1 }],
    [digital.id, { type: "co_op", title: "تدريب تعاوني في تحليل البيانات", city: "الرياض", workMode: "hybrid", seatsAvailable: 4, description: "برنامج تدريبي لطلاب وطالبات الجامعات للعمل على لوحات البيانات واستخراج المؤشرات ودعم قرارات فرق المنتج.", fieldNames: ["علوم البيانات والذكاء الاصطناعي"], requiredAcademicLevel: "المستوى السابع فأعلى" }],
    [digital.id, { type: "job", title: "مصمم تجربة مستخدم", city: "الرياض", workMode: "remote", seatsAvailable: 1, description: "تصميم رحلات استخدام واضحة، وإجراء مقابلات المستخدمين، وتحويل النتائج إلى نماذج أولية قابلة للاختبار.", fieldNames: ["تصميم تجربة المستخدم والواجهات", "تصميم الجرافيك"], requiredQualification: "بكالوريوس", requiredSkills: "Figma,User Research,Prototyping", minimumYearsExperience: 2 }],
    [impact.id, { type: "job", title: "منسق برامج مجتمعية", city: "جدة", workMode: "on_site", seatsAvailable: 2, description: "تنسيق المبادرات المجتمعية ومتابعة الشركاء والمتطوعين وإعداد تقارير الأثر الدورية.", fieldNames: ["الخدمة الاجتماعية والعمل التطوعي", "إدارة المشاريع"], requiredQualification: "بكالوريوس", requiredSkills: "التواصل,إدارة المبادرات,إعداد التقارير", minimumYearsExperience: 1 }],
    [impact.id, { type: "volunteering", title: "متطوع لصناعة المحتوى التوعوي", city: "جدة", workMode: "remote", seatsAvailable: 8, description: "المساهمة في إعداد محتوى رقمي مبسط لحملات توعوية موجهة للشباب والأسر.", fieldNames: ["الإعلام وصناعة المحتوى", "التسويق الرقمي"], requiresResume: "false" }],
    [academy.id, { type: "job", title: "مصمم محتوى تعليمي", city: "الدمام", workMode: "hybrid", seatsAvailable: 2, description: "تصميم حقائب تعليمية رقمية وأنشطة تطبيقية وقياس أثر التعلم بالتعاون مع خبراء التخصص.", fieldNames: ["التربية والتعليم", "التعليم والتدريب"], requiredQualification: "بكالوريوس", requiredSkills: "التصميم التعليمي,كتابة المحتوى,أدوات التأليف", minimumYearsExperience: 2 }],
    [academy.id, { type: "co_op", title: "تدريب تعاوني في الأمن السيبراني", city: "الدمام", workMode: "on_site", seatsAvailable: 3, description: "تدريب تطبيقي على أساسيات مراقبة الأنظمة وتحليل التنبيهات ورفع الوعي بالممارسات الأمنية.", fieldNames: ["الشبكات وأمن المعلومات"], requiredAcademicLevel: "المستوى السادس فأعلى" }],
  ];
  const createdOpportunities = [];
  for (const [organizationProfileId, opportunity] of opportunitySeeds) {
    createdOpportunities.push(await ensureOpportunity(organizationProfileId, opportunity, fieldIdsByName));
  }

  await seedAdmin();
  if (applicant && createdOpportunities[0]) await seedSampleApplication(applicant.id, createdOpportunities[0].id);

  console.log("\nاكتملت بيانات العرض بنجاح.\n");
  console.log("حسابات الدخول (كلمة المرور للجميع: Test@12345):");
  console.log("  باحث: applicant@test.com");
  console.log("  جهة: organization@test.com");
  console.log("  مدير: admin@test.com (عبر /admin-login)");
  process.exit(0);
}

main().catch((error) => {
  console.error("فشل إعداد بيانات العرض:", error);
  process.exit(1);
});
