
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const cleanJsonString = (jsonStr: string): string => {
  // Remove Markdown code block syntax if present
  let clean = jsonStr.replace(/```json/g, '').replace(/```/g, '');
  return clean.trim();
};

export const addWatermark = (base64Image: string, text: string = "UTen 幼狮"): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Watermark Style
      const fontSize = Math.floor(img.width * 0.04); // 4% of width
      ctx.font = `900 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      const padding = Math.floor(img.width * 0.03);
      const x = img.width - padding;
      const y = img.height - padding;

      // Drop Shadow for visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Text Color (White)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(text, x, y);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
  });
};
