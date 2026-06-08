namespace Hrms.NewApi.Support;

public static class LeaveAccrualSettings
{
    /// <summary>
    /// Day of month (company timezone) when monthly carry-forward is processed.
    /// Change this constant to adjust the accrual date globally.
    /// </summary>
    public const int MonthEndProcessingDay = 26;
}
