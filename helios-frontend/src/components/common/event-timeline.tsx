import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
}

interface EventTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function EventTimeline({ events, className }: EventTimelineProps) {
  return (
    <div className={cn('relative space-y-0', className)}>
      {events.map((event, i) => (
        <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Vertical line */}
          {i < events.length - 1 && (
            <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
          )}
          {/* Dot */}
          <div className="relative z-10 mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
            {event.icon ?? <div className="h-2 w-2 rounded-full bg-muted-foreground" />}
          </div>
          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{event.title}</p>
            {event.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{event.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

