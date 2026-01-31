"use client";

import { useRef, useEffect, useState } from "react";
import EventShareTemplate, { ShareTemplateType } from "./EventShareTemplate";
import { captureElementAsDataURL } from "@/lib/share/captureImage";
import { formatShortAddress } from "@/lib/formatAddress";

type EventShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onShare: (templateRef: HTMLElement | null, eventTitle: string) => Promise<boolean>;
  isGenerating: boolean;
  isSharing: boolean;
  eventTitle: string;
  sportType: string;
  datetime: string;
  location: string;
  hostName: string;
  isPastEvent: boolean;
  eventUrl: string;
};

export default function EventShareModal({
  isOpen,
  onClose,
  onShare,
  isGenerating,
  isSharing,
  eventTitle,
  sportType,
  datetime,
  location,
  hostName,
  isPastEvent,
  eventUrl,
}: EventShareModalProps) {
  const templateRef = useRef<HTMLDivElement>(null);
  const [templateType, setTemplateType] = useState<ShareTemplateType>(
    isPastEvent ? "completed" : "upcoming"
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const date = new Date(datetime);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const message = `Join me for ${eventTitle}!

${formattedDate} at ${formattedTime}
${formatShortAddress(location)}

Sign up here: ${eventUrl}`;

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate preview when modal opens or template type changes
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      return;
    }

    async function generatePreview() {
      setIsLoadingPreview(true);
      // Small delay to ensure template is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (templateRef.current) {
        const dataUrl = await captureElementAsDataURL(templateRef.current);
        setPreviewUrl(dataUrl);
      }
      setIsLoadingPreview(false);
    }

    generatePreview();
  }, [isOpen, templateType]);

  // Update template type when isPastEvent changes
  useEffect(() => {
    setTemplateType(isPastEvent ? "completed" : "upcoming");
  }, [isPastEvent]);

  const handleShare = async () => {
    const success = await onShare(templateRef.current, eventTitle);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden template for capture */}
      <EventShareTemplate
        ref={templateRef}
        templateType={templateType}
        eventTitle={eventTitle}
        sportType={sportType}
        datetime={datetime}
        location={location}
        hostName={hostName}
      />

      {/* Modal overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-zinc-900">
              Share to Stories
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Template type toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setTemplateType("upcoming")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                templateType === "upcoming"
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Invite Friends
            </button>
            <button
              onClick={() => setTemplateType("completed")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                templateType === "completed"
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Celebrate
            </button>
          </div>

          {/* Preview */}
          <div className="mb-3 flex justify-center">
            <div className="rounded-xl overflow-hidden bg-zinc-100 w-52 aspect-[9/16] relative">
              {isLoadingPreview ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-emerald-600" />
                </div>
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Share preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs">
                  Loading...
                </div>
              )}
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={isGenerating || isSharing || isLoadingPreview}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : isSharing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                  />
                </svg>
                <span>Share to Stories</span>
              </>
            )}
          </button>

          <p className="text-xs text-zinc-400 text-center mt-2 mb-3">
            Opens share menu on mobile, downloads on desktop
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-xs text-zinc-400">or</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Copy Link button */}
          <button
            onClick={handleCopyLink}
            className="w-full py-3 border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-emerald-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span className="text-emerald-600">Invite Copied!</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
