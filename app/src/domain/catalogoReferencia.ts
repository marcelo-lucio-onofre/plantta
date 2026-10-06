/**
 * Taxonomia de referência do catálogo — não é banco de SKU/preço/fornecedor
 * (isso é dado real, por-construtora, em MaterialCatalogItem). É só a
 * consistência de categoria/marca/ambiente pra relatório não fragmentar em
 * "Piso" vs "piso" vs "PISO", ou "Portobello" vs "portobello".
 */

export const CATEGORIAS_MATERIAL = [
  "Piso",
  "Revestimento",
  "Louças e Metais",
  "Bancada",
  "Cuba",
  "Porta",
  "Janela / Esquadria",
  "Box / Vidro",
  "Pintura",
  "Iluminação",
  "Tomada e Interruptor",
  "Forro",
  "Rodapé",
  "Armário Planejado",
  "Eletrodoméstico",
  "Automação",
  "Ar-condicionado",
  "Fechadura",
] as const;

export const MARCAS_SUGERIDAS = [
  "Portobello", "Eliane", "Portinari", "Incepa", "Cecafi",
  "Roca", "Deca", "Celite", "Icasa",
  "Docol", "Hydra", "Fabrimar", "Lorenzetti", "Perflex",
  "Franke", "Blanco", "Tramontina",
  "Dekton", "Silestone", "Quartzolit",
  "Duratex", "Eucatex", "Tigre",
  "Suvinil", "Sherwin-Williams", "Coral",
  "Todeschini", "Bertolini",
  "Fischer", "Buschbeck",
  "Sasazaki", "Blindex", "Taschibra", "Brastemp", "Intelbras", "Springer", "Papaiz",
] as const;

export const AMBIENTES_SUGERIDOS = [
  "Sala de estar", "Sala de jantar", "Cozinha", "Área gourmet",
  "Banheiro social", "Lavabo", "Suíte master", "Banheiro suíte",
  "Quarto 2", "Quarto 3", "Closet", "Escritório",
  "Área de serviço", "Varanda", "Hall de entrada",
] as const;
