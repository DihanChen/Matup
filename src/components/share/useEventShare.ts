"use client";

import { useState, useCallback } from "react";
import { captureElementAsImage } from "@/lib/share/captureImage";

export type ShareTemplateType = "upcoming" | "completed";

export function useEventShare() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const shareImage = useCallback(
    async (
      templateRef: HTMLElement | null,
      eventTitle: string
    ): Promise<boolean> => {
      if (!templateRef) return false;

      setIsGenerating(true);

      try {
        const blob = await captureElementAsImage(templateRef);
        if (!blob) {
          setIsGenerating(false);
          return false;
        }

        const file = new File([blob], `${eventTitle.replace(/\s+/g, "-")}.png`, {
          type: "image/png",
        });

        setIsGenerating(false);
        setIsSharing(true);

        // Try Web Share API first (works on mobile)
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: eventTitle,
              text: `Join me for ${eventTitle} on MatUp!`,
            });
            setIsSharing(false);
            return true;
          } catch (err) {
            // User cancelled or share failed - fall through to download
            if ((err as Error).name === "AbortError") {
              setIsSharing(false);
              return false;
            }
          }
        }

        // Fallback: Download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${eventTitle.replace(/\s+/g, "-")}-matup.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsSharing(false);
        return true;
      } catch (error) {
        console.error("Share failed:", error);
        setIsGenerating(false);
        setIsSharing(false);
        return false;
      }
    },
    []
  );

  return {
    isModalOpen,
    isGenerating,
    isSharing,
    openModal,
    closeModal,
    shareImage,
  };
}
