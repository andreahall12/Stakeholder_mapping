# Multi-stage build for minimal final image
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o stakeholder-tool ./cmd/server

# ---
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
RUN adduser -D -h /app appuser

WORKDIR /app
COPY --from=builder /app/stakeholder-tool .
COPY --from=builder /app/db/ ./db/
COPY --from=builder /app/web/ ./web/

USER appuser
EXPOSE 1420

ENV STAKEHOLDER_HOST=0.0.0.0
ENV STAKEHOLDER_PORT=1420
ENV STAKEHOLDER_DB_PATH=/app/data/stakeholder.db

VOLUME ["/app/data"]

ENTRYPOINT ["./stakeholder-tool"]
