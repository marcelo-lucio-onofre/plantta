import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const emailjsConfigurado = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * Dispara e-mail real via EmailJS quando as 3 chaves estão em `.env` (ver
 * `.env.example`) — senão resolve `false` sem fazer nada, e quem chamou
 * cai de volta no toast simulado de sempre (nenhum backend neste
 * protótipo, então isso é sempre "melhor esforço", nunca garantido).
 * `params` vira as variáveis do template no EmailJS (to_email, to_name,
 * subject, message... o nome exato depende de como o template foi
 * configurado na conta).
 */
export async function enviarEmail(params: Record<string, string>): Promise<boolean> {
  if (!emailjsConfigurado) return false;
  try {
    await emailjs.send(SERVICE_ID!, TEMPLATE_ID!, params, { publicKey: PUBLIC_KEY! });
    return true;
  } catch (err) {
    console.error("EmailJS falhou, caindo pro modo simulado:", err);
    return false;
  }
}
