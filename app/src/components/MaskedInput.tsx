import { useEffect, useRef, type CSSProperties } from "react";
import { formatCentavosBRL } from "../domain/mask";

/**
 * Input com máscara de dígitos (telefone, CPF, CNPJ...) que preserva a
 * posição do cursor — sem isso, digitar/apagar no meio do valor sempre
 * pula o cursor pro fim a cada tecla, o que trava exatamente o "dá pra
 * digitar e apagar" que esse tipo de campo precisa. `value`/`onChange`
 * trafegam a string já mascarada (mesmo formato guardado no domínio hoje,
 * ex. Pessoa.telefone), então plugar isso não muda nenhum tipo.
 */
export function MaskedInput({
  value,
  onChange,
  mask,
  maxDigits,
  className = "input",
  style,
  placeholder,
  disabled,
  id,
  onBlur,
}: {
  value: string;
  onChange: (masked: string) => void;
  mask: (digitos: string) => string;
  maxDigits: number;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  onBlur?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const proximoCursor = useRef<number | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const caretPos = e.target.selectionStart ?? raw.length;
    const digitosAntesDoCursor = raw.slice(0, caretPos).replace(/\D/g, "").length;
    const digitos = raw.replace(/\D/g, "").slice(0, maxDigits);
    const masked = mask(digitos);

    let contador = 0;
    let posicao = masked.length;
    if (digitosAntesDoCursor === 0) {
      posicao = 0;
    } else {
      for (let i = 0; i < masked.length; i++) {
        if (/\d/.test(masked[i])) contador++;
        if (contador === digitosAntesDoCursor) {
          posicao = i + 1;
          break;
        }
      }
    }
    proximoCursor.current = posicao;
    onChange(masked);
  }

  useEffect(() => {
    const el = ref.current;
    if (el && proximoCursor.current != null && document.activeElement === el) {
      el.setSelectionRange(proximoCursor.current, proximoCursor.current);
    }
  });

  return (
    <input
      ref={ref}
      id={id}
      className={className}
      style={style}
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

/**
 * Input monetário (R$ 1.234,56) — digita/apaga sempre a partir do fim
 * (padrão de campo de valor tipo calculadora: cada dígito entra como
 * centavo mais à direita, backspace tira o último). Evita de vez o
 * problema de cursor no meio de um valor formatado. `value`/`onChange`
 * trabalham em reais (número), não centavos — bate com os campos do
 * domínio (Opcao.preco, Item.valorPadrao etc.), zero mudança de tipo.
 */
export function MoedaInput({
  value,
  onChange,
  className = "input",
  style,
  placeholder = "R$ 0,00",
  disabled,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const centavos = Math.round((value || 0) * 100);
  const display = formatCentavosBRL(centavos);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, "");
    const novosCentavos = digitos ? parseInt(digitos, 10) : 0;
    onChange(novosCentavos / 100);
  }

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement === el) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  });

  return (
    <input
      ref={ref}
      id={id}
      className={className}
      style={style}
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
