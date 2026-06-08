namespace Hrms.NewApi.Dtos;

public class PolicyResponseDto
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public decimal WorkHours { get; set; }

    public decimal HalfdayThreshold { get; set; }

    public int CheckinGracePeriod { get; set; }

    public int CheckoutGracePeriod { get; set; }

    public string WorkDays { get; set; } = string.Empty;

    public TimeSpan ShiftStart { get; set; }

    public TimeSpan ShiftEnd { get; set; }

    public int RegularizationWindowDays { get; set; }
}