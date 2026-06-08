using TimeZoneConverter;

namespace Hrms.NewApi.Support;

public static class FiscalYearHelper
{
    public static DateOnly GetCompanyToday(string? timezone)
    {
        var timezoneInfo = TZConvert.GetTimeZoneInfo(
            string.IsNullOrWhiteSpace(timezone) ? "Asia/Kolkata" : timezone);

        return DateOnly.FromDateTime(
            TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, timezoneInfo).DateTime);
    }

    public static short GetFiscalCycleStartYear(
        DateOnly today,
        short fiscalYearStartMonth,
        short fiscalYearStartDay)
    {
        var normalizedMonth = NormalizeMonth(fiscalYearStartMonth);
        var normalizedDay = NormalizeDay(fiscalYearStartDay, normalizedMonth, today.Year);

        var fiscalStartThisCalendarYear = new DateOnly(
            today.Year,
            normalizedMonth,
            normalizedDay);

        return today >= fiscalStartThisCalendarYear
            ? (short)today.Year
            : (short)(today.Year - 1);
    }

    public static string GetMonthKey(DateOnly date) =>
        $"{date.Year:D4}-{date.Month:D2}";

    public static decimal CalculateMonthlyAllocation(decimal maxDaysAllowed) =>
        Math.Round(maxDaysAllowed / 12m, 1, MidpointRounding.AwayFromZero);

    public static (short Month, short Day) NormalizeFiscalStart(
        short fiscalYearStartMonth,
        short fiscalYearStartDay)
    {
        var month = NormalizeMonth(fiscalYearStartMonth);
        var day = NormalizeDay(fiscalYearStartDay, month, DateTime.UtcNow.Year);
        return (month, day);
    }

    private static short NormalizeMonth(short fiscalYearStartMonth) =>
        fiscalYearStartMonth is >= 1 and <= 12
            ? fiscalYearStartMonth
            : (short)4;

    private static short NormalizeDay(short fiscalYearStartDay, int month, int year)
    {
        var maxDay = DateTime.DaysInMonth(year, month);
        if (fiscalYearStartDay < 1)
        {
            return 1;
        }

        return fiscalYearStartDay > maxDay
            ? (short)maxDay
            : fiscalYearStartDay;
    }
}
