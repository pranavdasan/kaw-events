import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Check, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

/**
 * Custom confirmation dialog with animation.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) => {
  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-error/10',
      iconColor: 'text-error',
      confirmBg: 'bg-error',
      confirmHover: 'hover:bg-error/90',
      borderColor: 'border-error/30'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      confirmBg: 'bg-amber-600',
      confirmHover: 'hover:bg-amber-600/90',
      borderColor: 'border-amber-500/30'
    },
    info: {
      icon: AlertTriangle,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      confirmBg: 'bg-primary',
      confirmHover: 'hover:bg-primary/90',
      borderColor: 'border-primary/30'
    }
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-surface-container-lowest border rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-6 ${styles.borderColor}`}>
            <div className="flex items-start gap-4">
              <div className={`${styles.iconBg} ${styles.iconColor} p-3 rounded-xl shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 id="confirm-dialog-title" className="font-headline-md text-on-surface mb-2">{title}</h2>
                <p className="text-on-surface-variant font-body-md">{message}</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-label-caps text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-label-caps text-on-primary ${styles.confirmBg} ${styles.confirmHover} transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};