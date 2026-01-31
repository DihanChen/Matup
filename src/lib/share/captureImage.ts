// html2canvas wrapper for image generation
import html2canvas from "html2canvas";

export async function captureElementAsImage(
  element: HTMLElement
): Promise<Blob | null> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/png",
        1.0
      );
    });
  } catch (error) {
    console.error("Failed to capture image:", error);
    return null;
  }
}

export async function captureElementAsDataURL(
  element: HTMLElement
): Promise<string | null> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    return canvas.toDataURL("image/png", 1.0);
  } catch (error) {
    console.error("Failed to capture image:", error);
    return null;
  }
}
