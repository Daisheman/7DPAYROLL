import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const prisma = new PrismaClient();
const DEFAULT_EXCHANGE_RATE = 2600;

const EMPLOYEES = [
  { code:"SGM-N/A-1", name:"John Ajusa Snr",         title:"Project Manager",            contract:"Expert",   pay:"FIXED",  cur:"USD", usd:8000, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-03-13", nat:"Zimbabwe" },
  { code:"SGM-001",   name:"Sinethemba Ncube",        title:"Project Coordinator",        contract:"Expert",   pay:"FIXED",  cur:"USD", usd:2500, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-03-31", nat:"Zimbabwe" },
  { code:"SGM-N/A-2", name:"David Kyser",             title:"Engineering Superintendent", contract:"Expert",   pay:"FIXED",  cur:"USD", usd:4500, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-03-13", nat:"Zimbabwe" },
  { code:"SGM-007",   name:"Nicholas Mautah",         title:"Electrician Class 1",        contract:"Expert",   pay:"FIXED",  cur:"USD", usd:3300, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-03-31", nat:"Zimbabwe" },
  { code:"SGM-031",   name:"Shingirayi Gombiro",      title:"Electrician Class 1",        contract:"Expert",   pay:"FIXED",  cur:"USD", usd:1650, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-05-01", nat:"Zimbabwe" },
  { code:"SGM-008",   name:"Courage Tembarare",       title:"Boiler Maker 1",             contract:"Expert",   pay:"FIXED",  cur:"USD", usd:1350, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-03-21", nat:"Zimbabwe" },
  { code:"SGM-026",   name:"Roy Vundu",               title:"Boiler Maker 4",             contract:"Expert",   pay:"FIXED",  cur:"USD", usd:1650, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-05-01", nat:"Zimbabwe" },
  { code:"SGM-033",   name:"Darlington Mutinha",      title:"Boiler Maker 5",             contract:"Expert",   pay:"FIXED",  cur:"USD", usd:1650, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-05-17", nat:"Zimbabwe" },
  { code:"SGM-032",   name:"Privilege Mwale",         title:"Fitter",                     contract:"Expert",   pay:"FIXED",  cur:"USD", usd:1650, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-05-01", nat:"Zimbabwe" },
  { code:"SGM-ADM",   name:"Administration",          title:"Administration",             contract:"Contract", pay:"FIXED",  cur:"USD", usd:4000, rate:null,    hrs:null, housing:150000, transport:80000, site:150000, start:"2026-04-01", nat:"N/A" },
  { code:"SGM-003",   name:"Gaspa Simon Mpemba",      title:"Builder",                    contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:6410.26, hrs:234,  housing:150000, transport:80000, site:150000, start:"2026-03-27", nat:"Tanzania" },
  { code:"SGM-004",   name:"Samwel Yotam Deogras",    title:"Builder Assistant 1",        contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:3846.15, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-04", nat:"Tanzania" },
  { code:"SGM-005",   name:"Miraji Athuman Likwawa",  title:"Builder Assistant 2",        contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:3846.15, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-07", nat:"Tanzania" },
  { code:"SGM-006",   name:"Adamu Paulo Silwamba",    title:"Builder Assistant 3",        contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:3846.15, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-14", nat:"Tanzania" },
  { code:"SGM-010",   name:"Fredrick Ndege",          title:"Boiler Maker 2",             contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:6410.26, hrs:234,  housing:150000, transport:80000, site:150000, start:"2026-04-01", nat:"Tanzania" },
  { code:"SGM-011",   name:"Gervas Charles Idonya",   title:"Boiler Maker 3",             contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:6410.26, hrs:234,  housing:150000, transport:80000, site:150000, start:"2026-04-04", nat:"Tanzania" },
  { code:"SGM-012",   name:"Robert Biseko",           title:"Welder",                     contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:5128.21, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-03", nat:"Tanzania" },
  { code:"SGM-013",   name:"Peter Mashala Mashala",   title:"Boiler Maker Asst 2",        contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:3846.15, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-07", nat:"Tanzania" },
  { code:"SGM-030",   name:"Yohana Onesmo Enosy",    title:"Boiler Maker Asst 1",        contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:3846.15, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-05-11", nat:"Tanzania" },
  { code:"SGM-015",   name:"Makoye John",             title:"General Worker 1",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-10", nat:"Tanzania" },
  { code:"SGM-016",   name:"Ebeneza Poul",            title:"General Worker 2",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-10", nat:"Tanzania" },
  { code:"SGM-017",   name:"Elikana Simon Kasala",    title:"General Worker 3",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-03", nat:"Tanzania" },
  { code:"SGM-018",   name:"Simeo Brandy Katwiga",    title:"General Worker 4",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-03", nat:"Tanzania" },
  { code:"SGM-019",   name:"Joshua Kessy",            title:"General Worker 5",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-03", nat:"Tanzania" },
  { code:"SGM-020",   name:"Kelvin Pendel Salakike",  title:"General Worker 6",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-10", nat:"Tanzania" },
  { code:"SGM-021",   name:"Fredrick Malaki",         title:"General Worker 7",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-10", nat:"Tanzania" },
  { code:"SGM-022",   name:"Benjamin Wilium Aron",    title:"General Worker 8",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-12", nat:"Tanzania" },
  { code:"SGM-023",   name:"Yohana Gubi",             title:"General Worker 9",           contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-14", nat:"Tanzania" },
  { code:"SGM-024",   name:"Leison Loshi Lazer",      title:"General Worker 10",          contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-14", nat:"Tanzania" },
  { code:"SGM-025",   name:"Isaki Bariki Mbaya",      title:"General Worker 11",          contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-04-19", nat:"Tanzania" },
  { code:"SGM-027",   name:"Emmanuel Lazano",         title:"General Worker 12",          contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-05-11", nat:"Tanzania" },
  { code:"SGM-028",   name:"Godfrey Lugembe",         title:"General Worker 13",          contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-05-11", nat:"Tanzania" },
  { code:"SGM-029",   name:"Boaz Shimeji",            title:"General Worker 14",          contract:"Citizen",  pay:"HOURLY", cur:"TZS", usd:null, rate:2649.57, hrs:234,  housing:null,   transport:80000, site:150000, start:"2026-05-11", nat:"Tanzania" },
];

function splitName(fullName: string) {
  const parts = fullName.trim().split(" ");
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || parts[0] };
}

async function main() {
  console.log("🌱 Seeding 7D Minerals (SA) payroll data...");

  // Clean up existing data (order matters for FK constraints)
  await prisma.$executeRaw`DELETE FROM "PayrollLineSnapshot" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "PayrollItem" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "TimesheetImport" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "PayrollRun" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "LeaveRequest" WHERE "employeeId" IN (SELECT id FROM "Employee" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa')))`;
  await prisma.$executeRaw`DELETE FROM "SalaryHistory" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "AuditLog" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "User" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "Employee" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "CompanySetting" WHERE "companyId" IN (SELECT id FROM "Company" WHERE slug IN ('demo','7d-minerals-sa'))`;
  await prisma.$executeRaw`DELETE FROM "Company" WHERE slug IN ('demo','7d-minerals-sa')`;

  // Create company
  const company = await prisma.company.create({
    data: {
      name:         "7D Minerals (SA)",
      slug:         "7d-minerals-sa",
      registration: "7DM-SA-2025",
      contract:     "Sogomi Management Contract",
      country:      "TZ",
      taxYear:      "2025/26",
      nssfReg:      "NSSF-7DM-001",
      wcfReg:       "WCF-7DM-001",
      settings: {
        create: {
          payrollCutoffDay:  25,
          statutoryCurrency: "TZS",
          enableMfa:         false,
        },
      },
    },
  });
  console.log(`✅ Company: ${company.name}`);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      companyId:    company.id,
      name:         "Profacc Admin",
      email:        "admin@the7dcloud.com",
      passwordHash: await argon2.hash("Profacc2025#"),
      roles:        ["OWNER", "ADMIN", "PAYROLL_MANAGER", "HR_MANAGER"] as any[],
      mfaEnabled:   false,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Create all 33 employees
  const createdEmployees: any[] = [];
  let seq = 1;
  for (const emp of EMPLOYEES) {
    const { firstName, lastName } = splitName(emp.name);
    const baseSalary = emp.cur === "USD"
      ? (emp.usd ?? 0) * DEFAULT_EXCHANGE_RATE
      : 0;

    const created = await prisma.employee.create({
      data: {
        companyId:         company.id,
        employeeNumber:    emp.code === "SGM-N/A" ? `SGM-N/A-${seq++}` : emp.code,
        firstName,
        lastName,
        fullName:          emp.name,
        title:             emp.title,
        contractType:      emp.contract as any,
        employmentType:    emp.pay as any,
        // @ts-ignore
            currency:          emp.cur,
        baseSalary,
        usdSalary:         emp.usd ?? undefined,
        hourlyRate:        emp.rate ?? undefined,
        stdHoursPerMonth:  emp.hrs ?? undefined,
        housingAllowance:  emp.housing ?? undefined,
        transportAllowance: emp.transport ?? undefined,
        siteAllowance:     emp.site ?? undefined,
        nationality:       emp.nat,
        startDate:         new Date(emp.start),
        isActive:          true,
      },
    });
    createdEmployees.push(created);
  }
  console.log(`✅ Employees: ${createdEmployees.length} created`);

  console.log("✅ Seed complete!");
  console.log("\n🔐 Login credentials:");
  console.log("   Company slug : 7d-minerals-sa");
  console.log("   Email        : admin@the7dcloud.com");
  console.log("   Password     : Profacc2025#");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
