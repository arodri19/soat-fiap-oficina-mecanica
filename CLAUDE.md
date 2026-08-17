# Propósito do repositório

Aplicação principal (backend da oficina mecânica), executando em Kubernetes.

# Regras de workflow Git

- Nunca fazer push direto para as branches `main` e `homologacao`. Sempre criar/usar uma branch de trabalho e abrir um Pull Request para essas branches.
- Essas branches já têm branch protection configurada no GitHub (bloqueio de push direto). Esta regra é para o fluxo de trabalho local — não recriar a proteção via hooks ou automações aqui.
