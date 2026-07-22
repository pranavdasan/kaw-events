import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, Mail, MessageCircle, Twitter, Linkedin, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  url?: string;
}

/**
 * Mobile-optimized share popup modal supporting Web Share API,
 * copy link to clipboard, and direct social media quick links.
 */
export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  url
}) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = `Check out "${title}" at ${subtitle || 'this event'}!`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        // User cancelled share
      }
    }
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-black/10 dark:bg-white/10 text-on-surface hover:bg-black/20',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/20',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
      href: `mailto:?subject=${encodeURIComponent(`Session: ${title}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Modal / Sheet Box */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full max-w-lg bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/60 overflow-hidden z-10 p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-primary font-bold text-base m-0">Share Session</h3>
                  <p className="text-xs text-on-surface-variant font-medium m-0">Pass details to colleagues or friends</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
                aria-label="Close share dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Card */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-1">
              {subtitle && (
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block">
                  {subtitle}
                </span>
              )}
              <p className="font-bold text-sm text-on-surface line-clamp-2 m-0">{title}</p>
            </div>

            {/* Native Mobile Share Button (if supported) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-2xl font-bold text-sm shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-98"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via System Share Sheet...</span>
              </button>
            )}

            {/* Copy Link Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant block">Copy Direct Link</label>
              <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-surface-container-low border border-outline-variant/50">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs font-mono text-on-surface flex-grow focus:outline-none truncate select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-primary text-on-primary hover:opacity-90 active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Social Shares */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/30">
              <span className="text-xs font-bold text-on-surface-variant block">Quick Share via App</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all cursor-pointer border border-outline-variant/20 group ${item.color}`}
                  >
                    <item.icon className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
