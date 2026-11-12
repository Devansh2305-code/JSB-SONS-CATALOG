import React, { CSSProperties } from 'react';
import { StoreSettings } from '../types';

interface AnnouncementMarqueeProps {
  settings: StoreSettings;
  preview?: boolean;
  className?: string;
}

const SPEED_SECONDS: Record<string, number> = {
  slow: 58,
  normal: 40,
  fast: 26,
};

export const parseAnnouncementMessages = (announcement?: string): string[] =>
  (announcement || '')
    .split(/[|\n]+/)
    .map((message) => message.trim())
    .filter(Boolean);

export const AnnouncementMarquee: React.FC<AnnouncementMarqueeProps> = ({
  settings,
  preview = false,
  className = '',
}) => {
  const messages = parseAnnouncementMessages(settings.announcement);

  if (!preview && settings.announcementEnabled === false) return null;
  if (messages.length === 0) return null;

  const duration = SPEED_SECONDS[settings.announcementSpeed || 'normal'] || 40;

  return (
    <div
      className={`marquee-paused relative overflow-hidden border-b border-brass/25 bg-ink text-cream ${className}`}
      aria-label="Store announcements"
    >
      <div
        className="marquee-track flex w-max items-center py-2.5"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {[0, 1].map((group) => (
          <div
            key={group}
            className="flex shrink-0 items-center"
            aria-hidden={group === 1}
          >
            {messages.map((message, index) => (
              <span
                key={`${group}-${index}`}
                className="flex shrink-0 items-center gap-4 px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/85 sm:text-[11px]"
              >
                <span className="text-brass-soft" aria-hidden="true">
                  ✦
                </span>
                <span className="whitespace-nowrap">{message}</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
};
