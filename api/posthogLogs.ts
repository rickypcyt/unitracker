import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';

const posthogToken = process.env.POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.POSTHOG_HOST;

const loggerProvider = posthogToken && posthogHost
  ? new LoggerProvider({
      resource: resourceFromAttributes({
        'service.name': 'unitracker-api',
        'deployment.environment': process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
      }),
      processors: [
        new BatchLogRecordProcessor(
          new OTLPLogExporter({
            url: `${posthogHost.replace(/\/$/, '')}/i/v1/logs`,
            headers: { Authorization: `Bearer ${posthogToken}` },
          }),
        ),
      ],
    })
  : null;

const posthogLogger = loggerProvider?.getLogger('unitracker.posthog');

type LogAttributes = Record<string, string | number | boolean>;

export function logToPostHog(
  severityText: 'INFO' | 'ERROR',
  body: string,
  attributes: LogAttributes,
) {
  posthogLogger?.emit({ severityText, body, attributes });
}

const flushLogsAtShutdown = () => {
  void loggerProvider?.forceFlush().catch(() => {});
};

process.once('beforeExit', flushLogsAtShutdown);
process.once('SIGTERM', flushLogsAtShutdown);
