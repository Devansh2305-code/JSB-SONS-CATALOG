import React, { useState } from 'react';
import {
  MessageCircle,
  MapPin,
  Clock,
  Phone,
  Mail,
  Send,
  CheckCircle,
  ArrowUpRight,
  Navigation,
} from 'lucide-react';
import { StoreSettings } from '../types';
import { IMAGES } from '../assets/images';

interface ContactSectionProps {
  settings: StoreSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [garmentType, setGarmentType] = useState('School Uniforms (Govt / KV)');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${settings.address}, ${settings.city}`
  )}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let msg = `*Store enquiry — JSB SONS*\n\n`;
    msg += `▪ *Name:* ${name}\n`;
    msg += `▪ *Phone:* ${phone}\n`;
    msg += `▪ *City / Location:* ${city || 'Not specified'}\n`;
    msg += `▪ *Looking for:* ${garmentType}\n`;
    if (message) {
      msg += `▪ *Requirement:* ${message}\n`;
    }
    msg += `\nPlease confirm availability and share the next steps. Thank you!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = url;
    }
    setSubmitted(true);
  };

  return (
    <section
      id="contact-section"
      className="relative overflow-hidden border-t border-line/70 bg-paper-soft/45 pb-20 pt-14 sm:pt-20"
    >
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brass/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="eyebrow">Visit · Call · Message</span>
          <h2 className="mt-4 font-display text-3xl font-medium leading-[1.02] tracking-[-0.03em] text-ink text-balance sm:text-4xl lg:text-5xl">
            Come see the cloth <span className="italic text-wine">in person.</span>
          </h2>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-ink-soft sm:text-sm">
            Check the drape, feel the fabric and get an honest fit check at our counter — or
            send a WhatsApp message and we will reply with stock, prices and photos.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Store card */}
          <div className="space-y-5 lg:col-span-5">
            <div className="group relative overflow-hidden rounded-[1.75rem] border border-line/80 bg-cream shadow-[0_24px_50px_-38px_rgba(48,36,20,0.6)]">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={IMAGES.heroStorefront}
                  alt="JSB SONS storefront"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                <div className="absolute inset-x-5 bottom-5">
                  <span className="rounded-full border border-cream/25 bg-ink/55 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-brass-soft backdrop-blur-md">
                    The flagship counter
                  </span>
                  <p className="mt-2 font-display text-xl font-medium text-cream">
                    Since 1994, on the high street.
                  </p>
                </div>
              </div>

              <div className="space-y-0 divide-y divide-line/60 p-5 text-xs">
                <div className="flex items-start gap-3 pb-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-brass">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft/70">
                      Store address
                    </p>
                    <p className="mt-1 font-medium leading-relaxed text-ink">{settings.address}</p>
                    <p className="text-ink-soft">{settings.city}</p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-wine transition-colors hover:text-ink"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Get directions</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-brass">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft/70">
                      Shop timings
                    </p>
                    <div className="mt-1 space-y-0.5 font-medium leading-relaxed text-ink">
                      {settings.workingHours
                        .split('|')
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-brass">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft/70">
                      Call the shop
                    </p>
                    <a
                      href={`tel:${settings.displayPhone.replace(/[^0-9+]/g, '')}`}
                      className="mt-1 block font-medium text-ink transition-colors hover:text-wine"
                    >
                      {settings.displayPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-brass">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft/70">
                      Email
                    </p>
                    <a
                      href={`mailto:${settings.email}`}
                      className="mt-1 block truncate font-medium text-ink transition-colors hover:text-wine"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp priority card */}
            <div className="relative overflow-hidden rounded-[1.75rem] bg-forest p-5 text-cream shadow-[0_24px_50px_-38px_rgba(22,58,45,0.9)] sm:p-6">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cream/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cream/60">
                      Fastest route
                    </p>
                    <h3 className="font-display text-lg font-semibold">WhatsApp the counter</h3>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-cream/70">
                  Send a photo of what you like, ask for a size, or check today's stock —
                  we usually reply within minutes.
                </p>
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    'Hello JSB SONS, I would like to check available stock and prices.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-cream px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-forest transition-colors hover:bg-brass-soft hover:text-ink"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Start a WhatsApp chat</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Enquiry form */}
          <div className="rounded-[1.75rem] border border-line/80 bg-cream/85 p-5 shadow-[0_24px_50px_-38px_rgba(48,36,20,0.45)] sm:p-8 lg:col-span-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-brass">
                  Send an enquiry
                </span>
                <h3 className="mt-1.5 font-display text-2xl font-medium text-ink">
                  Tell us what you're looking for.
                </h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-forest">
                Replies on WhatsApp
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Fill in your details and we will route the enquiry straight to our shop team on
              WhatsApp.
            </p>

            {submitted ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-forest">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h4 className="font-display text-2xl font-medium text-ink">
                  Enquiry ready to send
                </h4>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-ink-soft">
                  WhatsApp should open with your details. If it did not, message us directly at{' '}
                  <strong className="text-ink">{settings.displayPhone}</strong>.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="press mt-6 rounded-full border border-line bg-paper px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink/40"
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      Your name *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="field text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      WhatsApp number *
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98200 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="field text-sm"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      City / delivery location
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Delhi, Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="field text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      What are you looking for?
                    </span>
                    <select
                      value={garmentType}
                      onChange={(e) => setGarmentType(e.target.value)}
                      className="field cursor-pointer text-sm"
                    >
                      <option>School Uniforms (Govt / KV)</option>
                      <option>Corporate & Bulk T-Shirts</option>
                      <option>Winter Collection</option>
                      <option>Ethnic & Festive Wear</option>
                      <option>Wedding & Bandhgala</option>
                      <option>Lab Coats</option>
                      <option>Size & fitting help</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                    Requirements or questions
                  </span>
                  <textarea
                    rows={4}
                    placeholder="Sizes, quantities, event dates, preferred colours or delivery timelines..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="field resize-none text-sm"
                  />
                </label>

                <button
                  type="submit"
                  className="press flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-wine"
                >
                  <Send className="h-4 w-4" />
                  <span>Send enquiry on WhatsApp</span>
                </button>

                <p className="text-center text-[10px] text-ink-soft/80">
                  No spam. Your details only go to the JSB SONS shop team.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
