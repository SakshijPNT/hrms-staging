using Hrms.NewApi.Models;



namespace Hrms.NewApi.Support;



public static class AttendanceStatusHelper

{

    public const string Present = "PRESENT";

    public const string HalfDay = "HALF_DAY";

    public const string ShortDay = "SHORT_DAY";

    public const string Absent = "ABSENT";

    public const string CheckedIn = "CHECKED_IN";



    public const string CorrectionFullDay = "FULL_DAY";

    public const string CorrectionHalfDay = "HALF_DAY";

    public const string CorrectionShortDay = "SHORT_DAY";

    public const string CorrectionForgotCheckIn = "FORGOT_CHECK_IN";

    public const string CorrectionForgotCheckOut = "FORGOT_CHECK_OUT";



    private static readonly HashSet<string> RegularizationEligibleStatuses =

    [

        Absent,

        HalfDay,

        ShortDay,

        CheckedIn,

    ];



    private static readonly HashSet<string> TimeBasedCorrectionTypes =

    [

        CorrectionForgotCheckIn,

        CorrectionForgotCheckOut,

    ];



    public static bool IsRegularizationEligible(string? status) =>

        status != null && RegularizationEligibleStatuses.Contains(status);



    public static bool IsTimeBasedCorrection(string? correctionType) =>

        correctionType != null && TimeBasedCorrectionTypes.Contains(correctionType);



    public static string ResolveFromWorkedMinutes(

        int workedMinutes,

        bool hasCheckIn,

        bool isEarlyLeave,

        CompanyPolicies policy)

    {

        if (!hasCheckIn)

        {

            return Absent;

        }



        if (workedMinutes <= 0)

        {

            return Absent;

        }



        var halfDayMinutes = (int)(policy.HalfDayThreshold * 60);

        var fullDayMinutes = (int)(policy.WorkHours * 60);



        if (!isEarlyLeave && workedMinutes >= fullDayMinutes)

        {

            return Present;

        }



        if (workedMinutes >= halfDayMinutes)

        {

            return HalfDay;

        }



        return ShortDay;

    }



    public static string ResolveEffectiveStatus(

        UserAttendanceLog? attendance,

        CompanyPolicies policy)

    {

        if (attendance == null)

        {

            return Absent;

        }



        if (!string.IsNullOrWhiteSpace(attendance.AttendanceStatus)

            && attendance.AttendanceStatus != CheckedIn)

        {

            return attendance.AttendanceStatus;

        }



        if (attendance.CheckInTime.HasValue && !attendance.CheckOutTime.HasValue)

        {

            return CheckedIn;

        }



        return ResolveFromWorkedMinutes(

            attendance.WorkedMinutes,

            attendance.CheckInTime.HasValue,

            attendance.IsEarlyLeave,

            policy);

    }



    public static string ResolveStatusAfterRegularization(

        string originalStatus,

        string requestedCorrectionType)

    {

        if (IsTimeBasedCorrection(requestedCorrectionType))

        {

            throw new InvalidOperationException(

                "Time-based corrections must resolve status from requested times.");

        }



        if (requestedCorrectionType == CorrectionFullDay)

        {

            return originalStatus switch

            {

                Absent or HalfDay or ShortDay or CheckedIn => Present,

                _ => throw new InvalidOperationException(

                    $"Cannot regularize from {originalStatus} to a full day."),

            };

        }



        if (requestedCorrectionType == CorrectionHalfDay)

        {

            return originalStatus switch

            {

                Absent or ShortDay or CheckedIn => HalfDay,

                _ => throw new InvalidOperationException(

                    $"Cannot regularize from {originalStatus} to a half day."),

            };

        }



        if (requestedCorrectionType == CorrectionShortDay)

        {

            return originalStatus switch

            {

                Absent or HalfDay or ShortDay or CheckedIn => ShortDay,

                _ => throw new InvalidOperationException(

                    $"Cannot regularize from {originalStatus} to a short day."),

            };

        }



        throw new InvalidOperationException(

            "Requested correction type is not supported.");

    }



    public static int ResolveWorkedMinutesForCorrection(

        string requestedCorrectionType,

        CompanyPolicies policy)

    {

        return requestedCorrectionType switch

        {

            CorrectionFullDay => (int)(policy.WorkHours * 60),

            CorrectionHalfDay => (int)(policy.HalfDayThreshold * 60),

            CorrectionShortDay => Math.Max(1, (int)(policy.HalfDayThreshold * 60) - 1),

            _ => throw new InvalidOperationException(

                "Worked minutes for this correction type must be derived from requested times."),

        };

    }

}


