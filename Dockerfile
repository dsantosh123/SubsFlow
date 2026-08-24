# ── Stage 1: Build Frontend ────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build Spring Boot Backend ─────────────────────
FROM maven:3.9.9-eclipse-temurin-17 AS backend-build
WORKDIR /workspace

COPY pom.xml ./
COPY src ./src

# Embed compiled React SPA distribution into Spring Boot static resources
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static/

RUN mvn -B -DskipTests clean package

# ── Stage 3: Lightweight Production JRE Runtime ────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

# Non-root user for security best practices
RUN useradd -r -u 1001 subsflow && chown -R subsflow:subsflow /app
USER subsflow

COPY --from=backend-build /workspace/target/*.jar app.jar

EXPOSE 8080 10000

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
