using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class AddParentModuleIdToModuleMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "parentmoduleid",
                table: "modulemaster",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_modulemaster_parentmoduleid",
                table: "modulemaster",
                column: "parentmoduleid");

            migrationBuilder.AddCheckConstraint(
                name: "chk_modulemaster_parent_not_self",
                table: "modulemaster",
                sql: "parentmoduleid IS NULL OR parentmoduleid <> id");

            migrationBuilder.AddForeignKey(
                name: "fk_modulemaster_parent",
                table: "modulemaster",
                column: "parentmoduleid",
                principalTable: "modulemaster",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_modulemaster_parent",
                table: "modulemaster");

            migrationBuilder.DropIndex(
                name: "ix_modulemaster_parentmoduleid",
                table: "modulemaster");

            migrationBuilder.DropCheckConstraint(
                name: "chk_modulemaster_parent_not_self",
                table: "modulemaster");

            migrationBuilder.DropColumn(
                name: "parentmoduleid",
                table: "modulemaster");
        }
    }
}
