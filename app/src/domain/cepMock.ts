/**
 * Busca de CEP mockada — protótipo não tem backend/API real de CEP, então
 * o endereço vem de uma tabela fixa, escolhida pelo primeiro dígito
 * (1 a 9) do CEP digitado. Sem número: número é sempre digitado à mão
 * (o CEP nunca sabe isso de verdade). Digitar "0" ou deixar vazio não
 * traz nada — ambíguo demais pra virar um dos 9 casos.
 */
export interface EnderecoMock {
  rua: string;
  cidade: string;
  uf: string;
}

const ENDERECOS_POR_PRIMEIRO_DIGITO: Record<string, EnderecoMock> = {
  "1": { rua: "Rua das Palmeiras", cidade: "São Paulo", uf: "SP" },
  "2": { rua: "Av. Atlântica", cidade: "Rio de Janeiro", uf: "RJ" },
  "3": { rua: "Rua da Bahia", cidade: "Belo Horizonte", uf: "MG" },
  "4": { rua: "Av. Sete de Setembro", cidade: "Salvador", uf: "BA" },
  "5": { rua: "Av. Boa Viagem", cidade: "Recife", uf: "PE" },
  "6": { rua: "Av. Beira Mar", cidade: "Fortaleza", uf: "CE" },
  "7": { rua: "Eixo Monumental", cidade: "Brasília", uf: "DF" },
  "8": { rua: "Av. Cândido de Abreu", cidade: "Curitiba", uf: "PR" },
  "9": { rua: "Av. Ipiranga", cidade: "Porto Alegre", uf: "RS" },
};

export function mockEnderecoPorCep(cep: string): EnderecoMock | null {
  const primeiroDigito = cep.replace(/\D/g, "")[0];
  if (!primeiroDigito) return null;
  return ENDERECOS_POR_PRIMEIRO_DIGITO[primeiroDigito] ?? null;
}
