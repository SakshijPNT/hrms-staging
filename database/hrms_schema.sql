CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" varchar(50) NOT NULL UNIQUE,
    "Description" varchar(200) NOT NULL,
    "CreatedUtc" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedUtc" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Users" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Email" varchar(180) NOT NULL UNIQUE,
    "PasswordHash" varchar(255) NOT NULL,
    "FirstName" varchar(80) NOT NULL,
    "LastName" varchar(80) NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "RoleId" uuid NOT NULL REFERENCES "Roles"("Id") ON DELETE RESTRICT,
    "CreatedUtc" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedUtc" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "EmployeeProfile" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" uuid NOT NULL UNIQUE REFERENCES "Users"("Id") ON DELETE CASCADE,
    "EmployeeCode" varchar(30) NOT NULL UNIQUE,
    "Department" varchar(100) NOT NULL,
    "JobTitle" varchar(120) NOT NULL,
    "PhoneNumber" varchar(20) NOT NULL DEFAULT '',
    "DateOfJoining" date NOT NULL,
    "CreatedUtc" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedUtc" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Attendance" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "WorkDate" date NOT NULL,
    "CheckInUtc" timestamp with time zone NULL,
    "CheckOutUtc" timestamp with time zone NULL,
    "Status" varchar(50) NOT NULL,
    "Notes" varchar(500) NULL,
    "CreatedUtc" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedUtc" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "UX_Attendance_UserId_WorkDate" UNIQUE ("UserId", "WorkDate")
);

CREATE TABLE IF NOT EXISTS "Requests" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Title" varchar(150) NOT NULL,
    "Description" varchar(1000) NOT NULL,
    "StartDate" date NOT NULL,
    "EndDate" date NOT NULL,
    "Status" varchar(50) NOT NULL,
    "SubmittedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
    "ReviewedAtUtc" timestamp with time zone NULL,
    "ReviewedById" uuid NULL,
    "DecisionNotes" varchar(500) NULL,
    "CreatedUtc" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedUtc" timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO "Roles" ("Name", "Description")
SELECT 'Admin', 'Full system administrator'
WHERE NOT EXISTS (SELECT 1 FROM "Roles" WHERE "Name" = 'Admin');

INSERT INTO "Roles" ("Name", "Description")
SELECT 'Supervisor', 'Team lead and approval manager'
WHERE NOT EXISTS (SELECT 1 FROM "Roles" WHERE "Name" = 'Supervisor');

INSERT INTO "Roles" ("Name", "Description")
SELECT 'Employee', 'Standard employee access'
WHERE NOT EXISTS (SELECT 1 FROM "Roles" WHERE "Name" = 'Employee');