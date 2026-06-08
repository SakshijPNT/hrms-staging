using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminRegularizationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "isadmincorrected",
                table: "userattendancelogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "reviewchannel",
                table: "attendanceregularizations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "admin_attendance_corrections",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    userid = table.Column<int>(type: "integer", nullable: false),
                    logdate = table.Column<DateOnly>(type: "date", nullable: false),
                    attendancelogid = table.Column<int>(type: "integer", nullable: true),
                    requestedcorrectiontype = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    session = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    requestedcheckintime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    requestedcheckouttime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    adminuserid = table.Column<int>(type: "integer", nullable: false),
                    statuscode = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)1),
                    createdby = table.Column<int>(type: "integer", nullable: false),
                    createdon = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_attendance_corrections", x => x.id);
                    table.ForeignKey(
                        name: "fk_aac_admin",
                        column: x => x.adminuserid,
                        principalTable: "usermaster",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_aac_attendance_log",
                        column: x => x.attendancelogid,
                        principalTable: "userattendancelogs",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_aac_user",
                        column: x => x.userid,
                        principalTable: "usermaster",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "idx_aac_logdate",
                table: "admin_attendance_corrections",
                column: "logdate");

            migrationBuilder.CreateIndex(
                name: "idx_aac_userid",
                table: "admin_attendance_corrections",
                column: "userid");

            migrationBuilder.CreateIndex(
                name: "IX_admin_attendance_corrections_adminuserid",
                table: "admin_attendance_corrections",
                column: "adminuserid");

            migrationBuilder.CreateIndex(
                name: "IX_admin_attendance_corrections_attendancelogid",
                table: "admin_attendance_corrections",
                column: "attendancelogid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_attendance_corrections");

            migrationBuilder.DropColumn(
                name: "isadmincorrected",
                table: "userattendancelogs");

            migrationBuilder.DropColumn(
                name: "reviewchannel",
                table: "attendanceregularizations");
        }
    }
}
