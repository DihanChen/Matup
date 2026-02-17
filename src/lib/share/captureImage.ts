type CaptureOptions = {
  scale: number;
  useCORS: boolean;
  allowTaint: boolean;
  backgroundColor: null;
  logging: boolean;
};

const DEFAULT_CAPTURE_OPTIONS: CaptureOptions = {
  scale: 2,
  useCORS: true,
  allowTaint: true,
  backgroundColor: null,
  logging: false,
};

async function getHtml2Canvas() {
  const html2canvasModule = await import('html2canvas');
  return html2canvasModule.default;
}

export async function captureElementAsImage(
  element: HTMLElement
): Promise<Blob | null> {
  try {
    const html2canvas = await getHtml2Canvas();
    const canvas = await html2canvas(element, {
      ...DEFAULT_CAPTURE_OPTIONS,
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
    const html2canvas = await getHtml2Canvas();
    const canvas = await html2canvas(element, {
      ...DEFAULT_CAPTURE_OPTIONS,
    });

    return canvas.toDataURL("image/png", 1.0);
  } catch (error) {
    console.error("Failed to capture image:", error);
    return null;
  }
}
