using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionToAttendanceRegularizations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE attendanceregularizations ADD COLUMN IF NOT EXISTS session character varying(20);");

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'chk_ar_session'
                    ) THEN
                        ALTER TABLE attendanceregularizations
                            ADD CONSTRAINT chk_ar_session
                            CHECK (session IS NULL OR session IN ('FIRST_HALF','SECOND_HALF'));
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE attendanceregularizations DROP CONSTRAINT IF EXISTS chk_ar_session;");

            migrationBuilder.Sql(
                "ALTER TABLE attendanceregularizations DROP COLUMN IF EXISTS session;");
        }
    }
}
