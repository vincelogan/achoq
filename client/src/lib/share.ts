import { toast } from "sonner";

export type SharePlatform = "whatsapp" | "facebook" | "instagram" | "x" | "copy";

/**
 * Dispara o compartilhamento para uma rede (ou copia o link).
 * Lógica única usada pelo SharePopup e pelo PostVoteShareModal.
 */
export async function shareToNetwork(platform: SharePlatform, text: string, url: string): Promise<void> {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  switch (platform) {
    case "whatsapp":
      window.open(`https://api.whatsapp.com/send?text=${encodedText}%0A%0A${encodedUrl}`, "_blank", "noopener,noreferrer");
      return;
    case "facebook":
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, "_blank", "noopener,noreferrer");
      return;
    case "x":
      window.open(`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, "_blank", "noopener,noreferrer");
      return;
    case "instagram":
      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast.success("Texto copiado! Cole no Instagram Stories ou Direct.");
      } catch {
        toast.info("Copie o link e cole no Instagram.");
      }
      return;
    case "copy":
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      } catch {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        toast.success("Link copiado!");
      }
      return;
  }
}
