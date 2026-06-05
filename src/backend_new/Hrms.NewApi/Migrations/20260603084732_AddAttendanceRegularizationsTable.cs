using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceRegularizationsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "attendanceregularizations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    userid = table.Column<int>(type: "integer", nullable: false),
                    logdate = table.Column<DateOnly>(type: "date", nullable: false),
                    attendancelogid = table.Column<int>(type: "integer", nullable: true),
                    originalcheckintime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    originalcheckouttime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    requestedcheckintime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    requestedcheckouttime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    approvalstatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    approvedby = table.Column<int>(type: "integer", nullable: true),
                    approvedon = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    approverremark = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    statuscode = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)1),
                    createdby = table.Column<int>(type: "integer", nullable: false),
                    createdon = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updatedby = table.Column<int>(type: "integer", nullable: false),
                    updatedon = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attendanceregularizations", x => x.id);
                    table.CheckConstraint("chk_ar_approvalstatus", "approvalstatus IN ('PENDING','APPROVED','REJECTED','CANCELLED')");
                    table.CheckConstraint("chk_ar_requested_times", "requestedcheckouttime > requestedcheckintime");
                    table.ForeignKey(
                        name: "fk_ar_approver",
                        column: x => x.approvedby,
                        principalTable: "usermaster",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_ar_attendance_log",
                        column: x => x.attendancelogid,
                        principalTable: "userattendancelogs",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_ar_user",
                        column: x => x.userid,
                        principalTable: "usermaster",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "idx_ar_approvalstatus",
                table: "attendanceregularizations",
                column: "approvalstatus");

            migrationBuilder.CreateIndex(
                name: "idx_ar_logdate",
                table: "attendanceregularizations",
                column: "logdate");

            migrationBuilder.CreateIndex(
                name: "idx_ar_userid",
                table: "attendanceregularizations",
                column: "userid");

            migrationBuilder.CreateIndex(
                name: "ix_ar_approvedby",
                table: "attendanceregularizations",
                column: "approvedby");

            migrationBuilder.CreateIndex(
                name: "ix_ar_attendancelogid",
                table: "attendanceregularizations",
                column: "attendancelogid");

            migrationBuilder.CreateIndex(
                name: "uq_ar_user_date_pending",
                table: "attendanceregularizations",
                columns: new[] { "userid", "logdate" },
                unique: true,
                filter: "approvalstatus = 'PENDING' AND statuscode = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "attendanceregularizations");
        }
    }
}
