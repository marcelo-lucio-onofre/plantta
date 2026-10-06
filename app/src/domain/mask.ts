/** Máscaras de exibição pra campo de formulário — puras, sem estado. O
 * componente que aplica (ver components/MaskedInput.tsx) cuida do cursor;
 * essas funções só recebem dígitos e devolvem a string formatada. */

export function maskTelefone(digitos: string): string {
  const d = digitos.slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCEP(digitos: string): string {
  const d = digitos.slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskCPF(digitos: string): string {
  const d = digitos.slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

export function maskCNPJ(digitos: string): string {
  const d = digitos.slice(0, 14);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);
  let out = p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `/${p4}`;
  if (p5) out += `-${p5}`;
  return out;
}

/** Fornecedor/Contato guardam CPF e CNPJ no mesmo campo de texto — troca
 * de máscara sozinho a partir do 12º dígito (CPF só tem 11). */
export function maskCpfCnpj(digitos: string): string {
  return digitos.length > 11 ? maskCNPJ(digitos) : maskCPF(digitos);
}

export function formatCentavosBRL(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(Math.round(centavos));
  const cents = String(abs % 100).padStart(2, "0");
  const reais = Math.floor(abs / 100).toLocaleString("pt-BR");
  return `${negativo ? "-" : ""}R$ ${reais},${cents}`;
}
