/** A tap-to-call link for something that looks like a phone number, or null for anything else. */
export const telHref = (detail: string) =>
  /^[\d\s()+.-]+$/.test(detail) && detail.replace(/\D/g, "").length >= 3 ? `tel:${detail.replace(/[^\d+]/g, "")}` : null;
