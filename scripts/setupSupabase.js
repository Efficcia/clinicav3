const { Client } = require('pg');

async function main() {
  const connectionOptions = process.env.SUPABASE_DB_URL
    ? { connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: 'db.ogbhjwcssthpktirygmt.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'PcryqVxIXlSzIGBdZKu4/bJyRY6+y6OXdNFKoNeBp/xPeKYw/CrJyEX1FwjLT3ADR6xkKYRC6Tz9nc+Rjp3PiA==',
        ssl: { rejectUnauthorized: false },
      };

  const client = new Client(connectionOptions);

  const ddl = `
  begin;
    create extension if not exists "pgcrypto";

    drop table if exists "waitlist" cascade;
    drop table if exists "appointments" cascade;
    drop table if exists "financial_entries" cascade;
    drop table if exists "team_members" cascade;
    drop table if exists "professionals" cascade;
    drop table if exists "patients" cascade;
    drop table if exists "company" cascade;

    create table "patients" (
      "id" uuid primary key default gen_random_uuid(),
      "name" text not null,
      "email" text,
      "phone" text,
      "birthDate" date,
      "gender" text,
      "document" text,
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now(),
      "createdBy" text,
      "updatedBy" text
    );

    create table "professionals" (
      "id" uuid primary key default gen_random_uuid(),
      "name" text not null,
      "email" text,
      "phone" text,
      "specialty" text not null,
      "license" text,
      "status" text not null default 'active',
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now()
    );

    create table "team_members" (
      "id" uuid primary key default gen_random_uuid(),
      "name" text not null,
      "email" text not null,
      "role" text not null check ("role" in ('admin','secretary')),
      "status" text not null default 'active',
      "lastLogin" timestamptz,
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now()
    );

    create table "appointments" (
      "id" uuid primary key default gen_random_uuid(),
      "patientId" uuid references "patients"("id") on delete cascade,
      "professionalId" uuid references "professionals"("id") on delete set null,
      "date" date not null,
      "time" text not null,
      "type" text,
      "status" text not null default 'scheduled',
      "notes" text,
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now()
    );

    create table "financial_entries" (
      "id" uuid primary key default gen_random_uuid(),
      "description" text not null,
      "type" text not null check ("type" in ('income','expense')),
      "amount" numeric not null,
      "date" date not null,
      "category" text not null default 'Outros',
      "paymentMethod" text,
      "status" text,
      "notes" text,
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now()
    );

    create table "waitlist" (
      "id" uuid primary key default gen_random_uuid(),
      "patientId" uuid references "patients"("id") on delete set null,
      "patientName" text not null,
      "contact" text not null,
      "preferredDoctor" text,
      "preferredDate" date,
      "status" text not null default 'waiting',
      "notes" text,
      "createdAt" timestamptz not null default now()
    );

    create table "company" (
      "id" uuid primary key default gen_random_uuid(),
      "name" text,
      "cnpj" text,
      "phone" text,
      "email" text,
      "data" jsonb default '{}'::jsonb,
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now()
    );

  commit;
  `;

  try {
    await client.connect();
    await client.query(ddl);
    console.log('Supabase schema provisioned successfully.');
  } catch (error) {
    console.error('Failed to apply Supabase schema:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
