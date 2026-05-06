using Hrms.Application.DTOs.Auth;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Security;
using Hrms.Application.Interfaces.Services;
using Hrms.Domain.Entities;

namespace Hrms.Infrastructure.Services;

public sealed class AuthService(
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    IEmployeeProfileRepository employeeProfileRepository,
    IJwtTokenGenerator jwtTokenGenerator,
    IPasswordHasher passwordHasher) : IAuthService
{
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null || !user.IsActive || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        return CreateLoginResponse(user);
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterUserRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var role = await roleRepository.GetByNameAsync(request.RoleName, cancellationToken)
            ?? throw new InvalidOperationException("Requested role is not configured.");

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            RoleId = role.Id,
            Role = role,
            IsActive = true
        };

        await userRepository.AddAsync(user, cancellationToken);

        var profile = new EmployeeProfile
        {
            UserId = user.Id,
            EmployeeCode = request.EmployeeCode.Trim(),
            Department = request.Department.Trim(),
            JobTitle = request.JobTitle.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            DateOfJoining = request.DateOfJoining
        };

        await employeeProfileRepository.AddAsync(profile, cancellationToken);

        user.EmployeeProfile = profile;
        return CreateLoginResponse(user);
    }

    private LoginResponseDto CreateLoginResponse(User user)
    {
        var (token, expiresAtUtc) = jwtTokenGenerator.GenerateToken(user);
        var assignedActivityCodes = user.Role?.RoleActivities
            .Where(roleActivity => roleActivity.Activity is not null)
            .Select(roleActivity => roleActivity.Activity!.Code)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(code => code)
            .ToList() ?? [];

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAtUtc = expiresAtUtc,
            User = new AuthenticatedUserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role?.Name ?? "Employee",
                EmployeeCode = user.EmployeeProfile?.EmployeeCode ?? string.Empty,
                AssignedActivityCodes = assignedActivityCodes,
                DateOfJoining = user.EmployeeProfile?.DateOfJoining
            }
        };
    }
}