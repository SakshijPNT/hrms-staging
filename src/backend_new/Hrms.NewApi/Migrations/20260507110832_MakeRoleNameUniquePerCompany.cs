using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class MakeRoleNameUniquePerCompany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_rolemaster_rolename",
                table: "rolemaster");

            migrationBuilder.CreateIndex(
                name: "uq_rolemaster_company_rolename",
                table: "rolemaster",
                columns: new[] { "companyid", "rolename" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_rolemaster_company_rolename",
                table: "rolemaster");

            migrationBuilder.CreateIndex(
                name: "uq_rolemaster_rolename",
                table: "rolemaster",
                column: "rolename",
                unique: true);
        }
    }
}
