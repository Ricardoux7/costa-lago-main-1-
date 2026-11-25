const ID = import.meta.env.VITE_FORMSPREE_ID;

export const emailConfigured = Boolean(ID);

export async function sendEmail(fields) {
  if (!ID) {
    console.info("[Modo demostración] Correo no enviado (falta VITE_FORMSPREE_ID):", fields);
    return { ok: true, demo: true };
  }
  try {
    const res = await fetch(`https://formspree.io/f/${ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return { ok: false, error: "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos." };
    return { ok: true, demo: false };
  } catch {
    return { ok: false, error: "Sin conexión. Revisa tu internet e inténtalo de nuevo." };
  }
}
