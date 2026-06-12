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
        maxDaysAllowed / 12m;

    public static DateOnly GetFiscalYearStartDate(
        short fiscalCycleYear,
        short fiscalYearStartMonth,
        short fiscalYearStartDay)
    {
        var month = NormalizeMonth(fiscalYearStartMonth);
        var day = NormalizeDay(fiscalYearStartDay, month, fiscalCycleYear);
        return new DateOnly(fiscalCycleYear, month, day);
    }

    public static (DateOnly Start, DateOnly End) GetFiscalMonthRangeForDate(
        DateOnly date,
        short fiscalYearStartMonth,
        short fiscalYearStartDay)
    {
        var cycleYear = GetFiscalCycleStartYear(
            date,
            fiscalYearStartMonth,
            fiscalYearStartDay);
        var fiscalStart = GetFiscalYearStartDate(
            cycleYear,
            fiscalYearStartMonth,
            fiscalYearStartDay);

        for (var monthIndex = 0; monthIndex < 12; monthIndex++)
        {
            var periodStart = fiscalStart.AddMonths(monthIndex);
            var periodEnd = fiscalStart.AddMonths(monthIndex + 1).AddDays(-1);

            if (date >= periodStart && date <= periodEnd)
            {
                return (periodStart, periodEnd);
            }
        }

        var lastStart = fiscalStart.AddMonths(11);
        var lastEnd = fiscalStart.AddYears(1).AddDays(-1);
        return (lastStart, lastEnd);
    }

    public static bool IsSameFiscalMonth(
        DateOnly left,
        DateOnly right,
        short fiscalYearStartMonth,
        short fiscalYearStartDay)
    {
        var (leftStart, _) = GetFiscalMonthRangeForDate(
            left,
            fiscalYearStartMonth,
            fiscalYearStartDay);
        var (rightStart, _) = GetFiscalMonthRangeForDate(
            right,
            fiscalYearStartMonth,
            fiscalYearStartDay);

        return leftStart == rightStart;
    }

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
