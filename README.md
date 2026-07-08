# ADS Orion - Orquestrador Inteligente de Anúncios (v3.2)

ADS Orion é uma plataforma SaaS (Software as a Service) de última geração que democratiza o acesso ao tráfego pago de alta performance. Utilizando Inteligência Artificial e integração direta via API, o sistema permite que qualquer pessoa lance campanhas profissionais em redes sociais sem nunca precisar abrir um Gerenciador de Anúncios complexo.

---

## 🚀 1. Conceito e Finalidade

O conceito central da ADS Orion é o **"Managed Ads Simplified"**. 
Enquanto ferramentas tradicionais exigem que o usuário aprenda pixels, tokens e segmentações manuais, a Orion atuando como um "cérebro" intermediário. O usuário fornece o objetivo e a verba; nós cuidamos da engenharia por trás da publicação.

**Finalidade:** Eliminar a barreira técnica entre o empreendedor e o lucro através de anúncios digitais.

---

## ⚖️ 2. Regras de Negócio e Monetização

A plataforma opera sob um modelo de **Taxa de Orquestração Silenciosa**:

*   **Transparência Visual:** O usuário tem uma experiência de 100% de aproveitamento. Se ele deposita R$ 1.000, ele vê R$ 1.000 em seu saldo e investe R$ 1.000 em sua campanha.
*   **Lógica de Backend (85/15):** Internamente, no ato do processamento da campanha, o sistema retém **15%** do valor como taxa de serviço/IA. Os **85%** restantes são convertidos em "Poder Real de Mídia".
*   **Automação de Saldo:** O sistema divide automaticamente a verba real pelo número de dias da campanha, garantindo que o orçamento nunca seja ultrapassado.

---

## 🛠️ 3. Recursos Principais

### 🔔 Notificações em Tempo Real
Sistema de broadcast onde administradores enviam avisos, atualizações e alertas financeiros que aparecem instantaneamente no painel dos usuários via Firestore Snapshots. Suporta modais de alta prioridade.

### 💳 Carteira e Auditoria MP
Integração via Checkout Transparente (PIX/Boleto) com módulo de **Auditoria Técnica** para validação de tokens e ambiente (Sandbox/Produção) em tempo real.

### 🤖 Orion AI Assistant
Integração com Genkit (Gemini 2.5 Flash) para geração de copy persuasiva e análise inteligente de performance baseada em dados reais do banco de dados.

### 🔒 Segurança e Isolamento
Arquitetura baseada em UIDs e regras de segurança rígidas do Firestore. Cada usuário é isolado em seu próprio ecossistema de dados.

---

## 📈 4. Tecnologia

*   **Next.js 15 & React 19:** Performance extrema e Server Actions.
*   **Firebase SDK v11:** Firestore (Long Polling para estabilidade), Auth e Hosting.
*   **Genkit:** Orquestração de LLMs (Google AI).
*   **Cloudinary:** CDN para ativos criativos.
*   **Mercado Pago SDK v2:** Processamento de pagamentos seguro.

---

© 2024-2026 ADS Orion - Inteligência Artificial aplicada ao Marketing Digital.
**Liderança:** Abel Santos (CEO) & Mitalo Ammon (CTO).
