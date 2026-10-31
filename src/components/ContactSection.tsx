import React, { useState } from 'react';
import {
  MessageCircle,
  MapPin,
  Clock,
  Phone,
  Mail,
  Send,
  CheckCircle,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface ContactSectionProps {
  settings: StoreSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [garmentType, setGarmentType] = useState('Festive Kurtas & Sherwanis');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare WhatsApp message
    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    let msg = `*VIP Boutique & Garment Enquiry - JSB SONS*\n\n`;
    msg += `▪ *Client Name:* ${name}\n`;
    msg += `▪ *Contact Phone:* ${phone}\n`;
    msg += `▪ *City / Location:* ${city || 'Not specified'}\n`;
    msg += `▪ *Garment of Interest:* ${garmentType}\n`;
    if (message) {
      msg += `▪ *Requirement / Question:* ${message}\n`;
    }
    msg += `\nPlease arrange a consultation or confirm stock. Thank you!`;

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
      className="relative border-t border-zinc-800 bg-zinc-950 pt-16 pb-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">
            <span>STORE LOCATION & CONTACT</span>
            <span aria-hidden="true">·</span>
            <span>DIRECT ENQUIRIES</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight text-balance">
            Visit Our Store or Message Us Directly.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed">
            Whether you need free fitting adjustments, wedding group orders, or quick home delivery, our team is ready to help you online and in our shop.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct WhatsApp & Store Information */}
          <div className="lg:col-span-5 space-y-6">
            {/* Instant WhatsApp Priority Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-700/40 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-5 h-5 fill-emerald-500/20" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-base">
                    Instant WhatsApp Chat
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">Quick reply within 5 mins</p>
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                Send photos of what you like, check fabric and colors on video call, or confirm your size directly.
              </p>
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  'Hello JSB SONS, I would like to check available stock and prices.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-zinc-950/20" />
                <span>Chat Directly on WhatsApp</span>
              </a>
            </div>

            {/* Store Information Card */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-zinc-200">Store Address</h4>
                  <p className="text-zinc-400 mt-0.5">{settings.address}</p>
                  <p className="text-zinc-400">{settings.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-zinc-800/80">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-zinc-200">Store Timings</h4>
                  <p className="text-zinc-400 mt-0.5">{settings.workingHours}</p>
                  <p className="text-emerald-400 font-medium mt-0.5">Fitting Tailor Available at Store</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-zinc-800/80">
                <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-zinc-200">Phone Support</h4>
                  <p className="text-zinc-400 mt-0.5">{settings.displayPhone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-zinc-800/80">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-zinc-200">Email Address</h4>
                  <p className="text-zinc-400 mt-0.5">{settings.email}</p>
                </div>
              </div>
            </div>

            {/* Store Perks */}
            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
              <div className="p-3 bg-zinc-900/40 rounded border border-zinc-800/60 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Free Fitting & Alteration</span>
              </div>
              <div className="p-3 bg-zinc-900/40 rounded border border-zinc-800/60 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Wedding Group & Bulk Discounts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Consultation & Enquiry Form */}
          <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xl">
            <h3 className="font-serif text-xl font-semibold text-zinc-100 mb-1">
              Send an Enquiry / Request a Callback
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Fill in your details below. We will immediately route your inquiry to our WhatsApp team for quick coordination.
            </p>

            {submitted ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-xl font-semibold text-zinc-100">
                  Enquiry Prepared!
                </h4>
                <p className="text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">
                  Your enquiry has opened in WhatsApp. If it did not open automatically, you can message us directly at{' '}
                  <strong className="text-zinc-200">{settings.displayPhone}</strong>.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-4 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors cursor-pointer"
                >
                  Send Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      WhatsApp Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98200 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      City / Delivery Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Delhi, Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Garment of Interest
                    </label>
                    <select
                      value={garmentType}
                      onChange={(e) => setGarmentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-amber-400/60"
                    >
                      <option value="Festive Kurtas & Sherwanis">Festive Kurtas & Sherwanis</option>
                      <option value="Ready Linen & Cotton Shirts">Ready Linen & Cotton Shirts</option>
                      <option value="Bandhgala & Blazers">Bandhgala & Blazers</option>
                      <option value="Tailored Trousers & Pants">Tailored Trousers & Pants</option>
                      <option value="Wedding Group Bulk Order">Wedding Group Bulk Order</option>
                      <option value="Size & Fitting Help">Size & Fitting Help</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Specific Requirements or Questions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about size preferences, event dates, preferred colorways, or delivery timelines..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 text-sm font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit & Connect with JSB SONS on WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
