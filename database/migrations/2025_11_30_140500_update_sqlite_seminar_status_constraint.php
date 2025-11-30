<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement(<<<'SQL'
CREATE TABLE "seminars_tmp" (
    "id" integer not null primary key autoincrement,
    "mahasiswa_id" integer not null,
    "pembimbing1_id" integer null,
    "pembimbing2_id" integer null,
    "penguji_id" integer null,
    "judul" varchar not null,
    "tipe" varchar not null check ("tipe" in ('proposal','hasil','kompre')),
    "abstrak" text null,
    "status" varchar not null default 'draft' check ("status" in ('draft','pending_verification','approved','scheduled','finished','revising','cancelled')),
    "skor_total" integer null,
    "verified_at" datetime null,
    "file_berkas" varchar null,
    "cancelled_at" datetime null,
    "cancel_reason" varchar(255) null,
    "created_at" datetime null,
    "updated_at" datetime null,
    foreign key ("mahasiswa_id") references "users"("id") on delete cascade,
    foreign key ("pembimbing1_id") references "users"("id") on delete set null,
    foreign key ("pembimbing2_id") references "users"("id") on delete set null,
    foreign key ("penguji_id") references "users"("id") on delete set null
)
SQL);

        DB::statement(<<<'SQL'
INSERT INTO "seminars_tmp" (
    "id","mahasiswa_id","pembimbing1_id","pembimbing2_id","penguji_id","judul",
    "tipe","abstrak","status","skor_total","verified_at","file_berkas",
    "cancelled_at","cancel_reason","created_at","updated_at"
)
SELECT
    "id","mahasiswa_id","pembimbing1_id","pembimbing2_id","penguji_id","judul",
    "tipe","abstrak",
    CASE WHEN "status" NOT IN ('draft','pending_verification','approved','scheduled','finished','revising','cancelled')
         THEN 'pending_verification' ELSE "status" END,
    "skor_total","verified_at","file_berkas","cancelled_at","cancel_reason","created_at","updated_at"
FROM "seminars"
SQL);

        DB::statement('DROP TABLE "seminars"');
        DB::statement('ALTER TABLE "seminars_tmp" RENAME TO "seminars"');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement(<<<'SQL'
CREATE TABLE "seminars_tmp" (
    "id" integer not null primary key autoincrement,
    "mahasiswa_id" integer not null,
    "pembimbing1_id" integer null,
    "pembimbing2_id" integer null,
    "penguji_id" integer null,
    "judul" varchar not null,
    "tipe" varchar not null check ("tipe" in ('proposal','hasil','kompre')),
    "abstrak" text null,
    "status" varchar not null default 'draft' check ("status" in ('draft','pending_verification','approved','scheduled','finished','revising')),
    "skor_total" integer null,
    "verified_at" datetime null,
    "file_berkas" varchar null,
    "cancelled_at" datetime null,
    "cancel_reason" varchar(255) null,
    "created_at" datetime null,
    "updated_at" datetime null,
    foreign key ("mahasiswa_id") references "users"("id") on delete cascade,
    foreign key ("pembimbing1_id") references "users"("id") on delete set null,
    foreign key ("pembimbing2_id") references "users"("id") on delete set null,
    foreign key ("penguji_id") references "users"("id") on delete set null
)
SQL);

        DB::statement(<<<'SQL'
INSERT INTO "seminars_tmp" (
    "id","mahasiswa_id","pembimbing1_id","pembimbing2_id","penguji_id","judul",
    "tipe","abstrak","status","skor_total","verified_at","file_berkas",
    "cancelled_at","cancel_reason","created_at","updated_at"
)
SELECT
    "id","mahasiswa_id","pembimbing1_id","pembimbing2_id","penguji_id","judul",
    "tipe","abstrak",
    CASE WHEN "status" = 'cancelled' THEN 'pending_verification' ELSE "status" END,
    "skor_total","verified_at","file_berkas","cancelled_at","cancel_reason","created_at","updated_at"
FROM "seminars"
SQL);

        DB::statement('DROP TABLE "seminars"');
        DB::statement('ALTER TABLE "seminars_tmp" RENAME TO "seminars"');

        Schema::enableForeignKeyConstraints();
    }
};
