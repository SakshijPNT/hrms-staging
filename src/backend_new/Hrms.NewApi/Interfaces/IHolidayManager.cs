using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IHolidayManager
{
    Task<IReadOnlyList<HolidayResponseDto>> GetHolidaysAsync(
        int companyId,
        int? year,
        CancellationToken cancellationToken = default);

    Task<HolidayResponseDto> CreateHolidayAsync(
        HolidayCreateDto request,
        int createdBy,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<HolidayResponseDto>> BulkCreateHolidaysAsync(
        HolidayBulkCreateDto request,
        int createdBy,
        CancellationToken cancellationToken = default);

    Task<HolidayResponseDto> UpdateHolidayAsync(
        HolidayUpdateDto request,
        int updatedBy,
        CancellationToken cancellationToken = default);

    Task DeleteHolidayAsync(
        int id,
        int companyId,
        CancellationToken cancellationToken = default);
}
