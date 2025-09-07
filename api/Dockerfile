# syntax=docker/dockerfile:1.7
FROM golang:1.22-alpine AS build
WORKDIR /app
COPY . .
ENV CGO_ENABLED=0
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    go build -ldflags="-s -w" -o server ./main.go

FROM alpine:3.19
WORKDIR /app
COPY --from=build /app/server /app/server
ENV API_PORT=8080
EXPOSE 8080
CMD ["/app/server"]
