FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY Hrms.NewApi/Hrms.NewApi.csproj Hrms.NewApi/
RUN dotnet restore Hrms.NewApi/Hrms.NewApi.csproj

COPY Hrms.NewApi/ Hrms.NewApi/
WORKDIR /src/Hrms.NewApi
RUN dotnet publish Hrms.NewApi.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 80
ENV ASPNETCORE_URLS=http://+:80

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Hrms.NewApi.dll"]
