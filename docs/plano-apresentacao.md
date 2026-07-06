# Plano de Apresentação em Vídeo: Sistema de Oficina Mecânica

Este documento descreve o roteiro e a estrutura recomendada para um vídeo de apresentação do projeto **soat-fiap-oficina-mecanica**. O objetivo é demonstrar as funcionalidades, a arquitetura e a qualidade técnica do sistema de forma clara e profissional.

---

## 📽️ Visão Geral do Vídeo
- **Duração Estimada:** 5 a 8 minutos.
- **Público-alvo:** Avaliadores técnicos, stakeholders e desenvolvedores.
- **Tom:** Profissional, objetivo e focado em soluções.

---

## 🗓️ Roteiro Estruturado

### 1. Introdução (30s - 1min)
*   **Fala:** Apresentação pessoal e do projeto. "Olá, este é o sistema de gestão de Oficina Mecânica, desenvolvido como parte da fase 2 do SOAT FIAP."
*   **Visual:** Slide de abertura com o nome do projeto, tecnologias principais (Node.js, Express, PostgreSQL, Prisma) e logo da FIAP.
*   **Destaque:** Problema resolvido: digitalização e controle eficiente de ordens de serviço, clientes, veículos e estoque.

### 2. Arquitetura e Decisões Técnicas (1min - 1:30min)
*   **Fala:** Explicar a escolha do stack tecnológico. "Utilizamos Node.js com Express pela agilidade e escalabilidade. O banco de dados PostgreSQL foi escolhido via ADR devido à necessidade de integridade relacional robusta."
*   **Visual:** 
    *   Exibir o diagrama de entidades (ERD) ou o arquivo `prisma/schema.prisma`.
    *   Mostrar brevemente o `README.md` e a pasta `docs/adr`.
*   **Destaque:** Clean Architecture, uso de Prisma ORM para migrations e tipagem segura.

### 3. Demonstração de Funcionalidades: Core (2min - 3min)
*   **Fala:** "Vamos percorrer o fluxo principal: desde o cadastro de clientes até a finalização de uma ordem de serviço."
*   **Visual:** Gravação de tela utilizando o **Swagger UI** (`/api-docs`) ou os arquivos `.http` na pasta `requests/`.
*   **Passos da Demo:**
    1.  **Auth:** Login como `ATTENDANT` (admin).
    2.  **Clientes/Veículos:** Mostrar a criação de um cliente PF e vinculação de um veículo.
    3.  **Fluxo de OS:** 
        *   Criar uma Ordem de Serviço (`RECEBIDA`).
        *   Alterar status para `EM_DIAGNOSTICO`.
        *   Adicionar Serviços e Peças à ordem.
        *   Verificar o cálculo automático do orçamento.
    4.  **Budgets:** Mostrar como múltiplas ordens podem ser consolidadas em um único orçamento.

### 4. Gestão de Estoque e Métricas (1min)
*   **Fala:** "O sistema também gerencia o estoque de peças e fornece métricas valiosas para a oficina."
*   **Visual:** 
    *   Requisição ao endpoint de `metrics/average-execution-time`.
    *   Exemplo de como a quantidade de peças é decrementada (ou mock de reposição).
*   **Destaque:** SLA de serviços e tempo médio de execução como diferencial competitivo.

### 5. Qualidade de Código e Testes (1min)
*   **Fala:** "A confiabilidade é garantida por uma cobertura abrangente de testes."
*   **Visual:** Terminal rodando `npm test`. Mostrar a separação entre `tests/unit` e `tests/integration`.
*   **Destaque:** Uso de Jest, mocks para serviços externos (email, pagamento) e ambiente de teste isolado.

### 6. Conclusão e Próximos Passos (30s)
*   **Fala:** "O sistema está pronto para produção, containerizado com Docker, e documentado para fácil manutenção e expansão."
*   **Visual:** Exibir o arquivo `docker-compose.yml` e o Swagger final.
*   **Encerramento:** "Obrigado pela atenção."

---

## 🛠️ Dicas para a Gravação

### Visual e Áudio
- **Resolução:** Grave em 1080p (Full HD).
- **Áudio:** Use um microfone de boa qualidade em um ambiente silencioso.
- **Zoom:** Aumente o zoom do seu editor de código e do navegador (Swagger) para que o texto fique legível em dispositivos móveis.

### Ferramentas Recomendadas
- **Gravação de Tela:** OBS Studio ou Loom.
- **Edição:** CapCut, DaVinci Resolve ou iMovie.
- **Apresentação:** Google Slides ou Canva para os slides de intro/conclusão.

### Checklist Pré-Gravação
1. [ ] Banco de dados limpo e populado com o seed (`npm run prisma:seed`).
2. [ ] Token JWT copiado e configurado no REST Client/Swagger.
3. [ ] Todos os serviços Docker rodando (`docker compose up`).
4. [ ] Testes passando 100%.

---

## 💡 Sugestões de Destaque Técnico (Para impressionar)
- **ADR 0001:** Mencione explicitamente a documentação de decisão arquitetural para o PostgreSQL.
- **Enum de Status:** Explique como o ciclo de vida da OS é controlado via Enums no banco.
- **Relacionamentos Complexos:** Destaque como o Prisma facilita a consulta de `OrderService` trazendo `Client`, `Vehicle` e `Services` em uma única chamada tipada.
