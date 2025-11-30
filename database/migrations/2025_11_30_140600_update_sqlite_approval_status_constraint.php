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
CREATE TABLE "seminar_approvals_tmp" (
    "id" integer not null primary key autoincrement,
    "seminar_id" integer not null,
    "dosen_id" integer not null,
    "peran" varchar not null check ("peran" in ('pembimbing1','pembimbing2','penguji')),
    "status" varchar not null default 'pending' check ("status" in ('pending','approved','rejected','cancelled')),
    "catatan" text null,
    "available_dates" text null,
    "approved_at" datetime null,
    "created_at" datetime null,
    "updated_at" datetime null,
    foreign key ("seminar_id") references "seminars"("id") on delete cascade,
    foreign key ("dosen_id") references "users"("id") on delete cascade,
    unique ("seminar_id","dosen_id","peran")
)
SQL);

        DB::statement(<<<'SQL'
INSERT INTO "seminar_approvals_tmp" (
    "id","seminar_id","dosen_id","peran","status","catatan","available_dates","approved_at","created_at","updated_at"
)
SELECT
    "id","seminar_id","dosen_id","peran",
    CASE WHEN "status" NOT IN ('pending','approved','rejected','cancelled')
         THEN 'pending' ELSE "status" END,
    "catatan","available_dates","approved_at","created_at","updated_at"
FROM "seminar_approvals"
SQL);

        DB::statement('DROP TABLE "seminar_approvals"');
        DB::statement('ALTER TABLE "seminar_approvals_tmp" RENAME TO "seminar_approvals"');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement(<<<'SQL'
CREATE TABLE "seminar_approvals_tmp" (
    "id" integer not null primary key autoincrement,
    "seminar_id" integer not null,
    "dosen_id" integer not null,
    "peran" varchar not null check ("peran" in ('pembimbing1','pembimbing2','penguji')),
    "status" varchar not null default 'pending' check ("status" in ('pending','approved','rejected')),
    "catatan" text null,
    "available_dates" text null,
    "approved_at" datetime null,
    "created_at" datetime null,
    "updated_at" datetime null,
    foreign key ("seminar_id") references "seminars"("id") on delete cascade,
    foreign key ("dosen_id") references "users"("id") on delete cascade,
    unique ("seminar_id","dosen_id","peran")
)
SQL);

        DB::statement(<<<'SQL'
INSERT INTO "seminar_approvals_tmp" (
    "id","seminar_id","dosen_id","peran","status","catatan","available_dates","approved_at","created_at","updated_at"
)
SELECT
    "id","seminar_id","dosen_id","peran",
    CASE WHEN "status" = 'cancelled' THEN 'pending' ELSE "status" END,
    "catatan","available_dates","approved_at","created_at","updated_at"
FROM "seminar_approvals"
SQL);

        DB::statement('DROP TABLE "seminar_approvals"');
        DB::statement('ALTER TABLE "seminar_approvals_tmp" RENAME TO "seminar_approvals"');

        Schema::enableForeignKeyConstraints();
    }
};
