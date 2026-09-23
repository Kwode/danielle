import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, Check, ExternalLink, HelpCircle, X, Sparkles } from 'lucide-react';
import {
  getSavedCloudinaryConfig,
  saveCloudinaryConfig,
  CloudinaryConfig,
} from '../utils/cloudinaryService';

interface CloudinaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const CloudinaryConfigModal: React.FC<CloudinaryConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getSavedCloudinaryConfig();
  const [cloudName, setCloudName] = useState(currentConfig.cloudName || '');
  const [uploadPreset, setUploadPreset] = useState(currentConfig.uploadPreset || '');
  const [showHelp, setShowHelp] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudName.trim() || !uploadPreset.trim()) return;

    const newConfig: CloudinaryConfig = {
      cloudName: cloudName.trim(),
      uploadPreset: uploadPreset.trim(),
    };

    saveCloudinaryConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onConfigSaved?.();
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-pink-200 overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">Cloudinary Cloud Storage</h3>
                <p className="text-xs text-pink-100 font-medium">Free unlimited photo & video hosting</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-pink-50/80 border border-pink-200/80 rounded-2xl p-3.5 text-xs text-pink-900 leading-relaxed">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <span>
                  Connect your free <strong>Cloudinary</strong> account to upload high-definition photos and videos directly to the cloud without exhausting Firebase database limits!
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Cloud Name
              </label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="e.g. demo or my-birthday-cloud"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Upload Preset (Unsigned)
              </label>
              <input
                type="text"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                placeholder="e.g. birthday_preset or ml_default"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm transition-all"
              />
            </div>

            {/* Quick 2-step setup guidance */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center gap-1.5 text-xs text-pink-600 font-semibold hover:text-pink-700 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHelp ? 'Hide quick setup instructions' : 'How do I get an Unsigned Upload Preset? (1 min)'}</span>
              </button>

              {showHelp && (
                <div className="mt-2.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-1.5 animate-fadeIn">
                  <p className="font-semibold text-neutral-900">In 3 simple clicks:</p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-600 pl-1">
                    <li>Log in to your free <a href="https://cloudinary.com/users/register_free" target="_blank" rel="noreferrer" className="text-pink-600 underline inline-flex items-center gap-0.5">Cloudinary Dashboard <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                    <li>Go to <strong>Settings (Gear icon) → Upload Presets</strong>.</li>
                    <li>Click <strong>Add Upload Preset</strong>, select <strong>Unsigned</strong>, and click <strong>Save</strong>. Copy the preset name and paste it above!</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Submit / Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!cloudName.trim() || !uploadPreset.trim() || savedSuccess}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  savedSuccess
                    ? 'bg-emerald-600'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 active:scale-95 disabled:opacity-50'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Connected!</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Save Cloudinary Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
