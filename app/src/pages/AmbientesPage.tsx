import { SimpleCadastroPage } from "../components/SimpleCadastroPage";
import { useApp } from "../state/AppContext";
import { ambienteNomeEmUso } from "../domain/usage";

export function AmbientesPage() {
  const { construtoraLogadaId, catalogo, catalogoAmbientes, criarAmbienteTipo, atualizarAmbienteTipo, removerAmbienteTipo } = useApp();
  const construtoraId = construtoraLogadaId ?? "";
  const tipos = catalogoAmbientes.list(construtoraId);

  return (
    <SimpleCadastroPage
      breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Cadastros auxiliares" }, { label: "Ambientes" }]}
      titulo="Tipos de ambiente"
      descricao="Taxonomia fechada usada ao adicionar ambientes numa planta — combo box em vez de texto livre, evita 'Suíte' e 'suite' virando duas linhas diferentes."
      itemLabel="tipo de ambiente"
      placeholder="Suíte Master"
      itens={tipos}
      emUso={(id) => ambienteNomeEmUso(tipos.find((t) => t.id === id)?.nome ?? "", catalogo, construtoraId)}
      emUsoMsg={(nome) => `"${nome}" está em uso em ao menos uma planta — remova o ambiente lá antes de excluir aqui.`}
      onCriar={(nome) => criarAmbienteTipo({ construtoraId, nome })}
      onAtualizar={(id, nome) => atualizarAmbienteTipo(id, { nome })}
      onRemover={removerAmbienteTipo}
    />
  );
}
