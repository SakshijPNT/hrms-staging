using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFiscalYearAndLeaveBalanceMonthlyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<short>(
                name: "fiscalyearstartmonth",
                table: "companymaster",
                type: "smallint",
                nullable: false,
                defaultValue: (short)4);

            migrationBuilder.AddColumn<short>(
                name: "fiscalyearstartday",
                table: "companymaster",
                type: "smallint",
                nullable: false,
                defaultValue: (short)1);

            migrationBuilder.AddColumn<decimal>(
                name: "monthlyallocation",
                table: "userleavebalances",
                type: "numeric(5,1)",
                precision: 5,
                scale: 1,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "monthlyused",
                table: "userleavebalances",
                type: "numeric(5,1)",
                precision: 5,
                scale: 1,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "monthlypending",
                table: "userleavebalances",
                type: "numeric(5,1)",
                precision: 5,
                scale: 1,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "monthlycarryforward",
                table: "userleavebalances",
                type: "numeric(5,1)",
                precision: 5,
                scale: 1,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "fiscalyearcarryforwardin",
                table: "userleavebalances",
                type: "numeric(5,1)",
                precision: 5,
                scale: 1,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "lastprocessedmonth",
                table: "userleavebalances",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "fiscalyearstartmonth",
                table: "companymaster");

            migrationBuilder.DropColumn(
                name: "fiscalyearstartday",
                table: "companymaster");

            migrationBuilder.DropColumn(
                name: "monthlyallocation",
                table: "userleavebalances");

            migrationBuilder.DropColumn(
                name: "monthlyused",
                table: "userleavebalances");

            migrationBuilder.DropColumn(
                name: "monthlypending",
                table: "userleavebalances");

            migrationBuilder.DropColumn(
                name: "monthlycarryforward",
                table: "userleavebalances");

            migrationBuilder.DropColumn(
                name: "fiscalyearcarryforwardin",
                table: "userleavebalances");

            migrationBuilder.DropColumn(
                name: "lastprocessedmonth",
                table: "userleavebalances");
        }
    }
}
