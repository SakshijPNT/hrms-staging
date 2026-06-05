using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface ICalendarManager
{
    Task<MonthlyCalendarResponseDto> GetMonthlyCalendarAsync(
        int userId,
        int year,
        int month,
        CancellationToken cancellationToken = default);

    Task<DayDetailResponseDto> GetDayDetailAsync(
        int userId,
        DateOnly date,
        CancellationToken cancellationToken = default);
}
