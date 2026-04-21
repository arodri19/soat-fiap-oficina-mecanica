# Checklist de separação de domínios

## Escopo crítico
- Cliente
- Ordem de Serviço
- Orçamento
- Veículo
- Peças
- Serviços

## Regras de separação
- [x] Entrada HTTP centralizada em `routes` e `controllers`.
- [x] Regras de negócio concentradas em `services` e/ou `domain`.
- [x] Acesso a banco concentrado em `repositories`.
- [x] `controllers` não importam Prisma diretamente.
- [x] `domain` não depende de `controllers` nem `routes`.
- [x] `services` não dependem de `controllers`.

## Evidências
- Teste de arquitetura: `tests/unit/architecture/domain-separation.test.js`
- Cobertura de serviços críticos em:
  - `tests/unit/services/basic-domains.service.test.js`
  - `tests/unit/services/order-budget.service.test.js`
- Configuração de cobertura focada em domínios críticos:
  - `jest.config.js` (`collectCoverageFrom` + `coverageThreshold`)

## Observações
- Métricas foi desacoplado para `controller -> service -> repository`:
  - `src/controllers/metrics.controller.js`
  - `src/services/metrics.service.js`
  - `src/repositories/metrics.repository.js`
