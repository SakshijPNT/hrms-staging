# ── Stage 1: Build .NET API ──────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS api-build
WORKDIR /src

COPY src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj backend/Hrms.NewApi/
RUN dotnet restore backend/Hrms.NewApi/Hrms.NewApi.csproj

COPY src/backend_new/Hrms.NewApi/ backend/Hrms.NewApi/
WORKDIR /src/backend/Hrms.NewApi
RUN dotnet publish Hrms.NewApi.csproj -c Release -o /app/publish /p:UseAppHost=false

# ── Stage 2: Build React frontend ────────────────────────────────────────────
FROM node:22-alpine AS web-build
WORKDIR /app

COPY src/hrms-frontend_new/package.json src/hrms-frontend_new/package-lock.json ./
RUN npm ci

COPY src/hrms-frontend_new/ ./

# Same-origin: nginx proxies /api → Kestrel (no server IP baked in)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 3: Runtime (nginx + .NET) ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx curl \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

COPY --from=api-build /app/publish ./api
COPY --from=web-build /app/dist /var/www/html

ENV ASPNETCORE_URLS=http://127.0.0.1:5000

EXPOSE 80
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
