import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso da Carteira Inteligente.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Condições de uso"
      title="Termos de Uso"
      description="Estes termos explicam as condições gerais para uso da Carteira Inteligente como plataforma de organização financeira pessoal."
      updatedAt="25 de junho de 2026"
      sections={[
        {
          title: "Objeto",
          paragraphs: [
            "A Carteira Inteligente é uma plataforma de organização financeira pessoal que permite cadastrar informações financeiras manualmente, acompanhar compromissos, visualizar fluxo de caixa e organizar objetivos.",
          ],
        },
        {
          title: "Natureza do serviço",
          paragraphs: [
            "O aplicativo ajuda a organizar informações e dar clareza financeira com base nos dados inseridos pelo usuário. A Carteira Inteligente não presta consultoria financeira, jurídica, contábil, fiscal ou de investimentos.",
            "As decisões financeiras tomadas a partir das informações exibidas no app são de responsabilidade do usuário. O serviço não substitui aconselhamento profissional individualizado.",
          ],
        },
        {
          title: "Conta do usuário",
          items: [
            "O usuário é responsável por manter o acesso seguro à própria conta.",
            "O usuário deve fornecer informações verdadeiras e manter seus dados atualizados.",
            "O usuário é responsável pelas informações financeiras cadastradas manualmente no aplicativo.",
          ],
        },
        {
          title: "Dados inseridos",
          paragraphs: [
            "O usuário deve inserir apenas dados próprios ou informações que esteja autorizado a organizar. O app foi desenvolvido para informações cadastradas voluntariamente pelo usuário.",
          ],
          items: [
            "Não insira senhas bancárias.",
            "Não insira CVV.",
            "Não insira credenciais de internet banking.",
            "Não insira dados de terceiros sem autorização.",
          ],
        },
        {
          title: "Trial e assinatura futura",
          paragraphs: [
            "O produto poderá oferecer 14 dias grátis sem cartão. Depois, poderá haver assinatura mensal para continuar usando recursos pagos.",
            "Valores, condições, forma de cobrança e funcionalidades incluídas serão apresentados ao usuário antes de qualquer cobrança.",
          ],
        },
        {
          title: "Disponibilidade",
          paragraphs: [
            "O serviço pode passar por manutenção, instabilidade, atualizações ou evolução de funcionalidades. Trabalharemos para manter a plataforma disponível e confiável, sem prometer disponibilidade absoluta.",
          ],
        },
        {
          title: "Propriedade intelectual",
          paragraphs: [
            "A marca Carteira Inteligente, o layout, o software, os textos e demais elementos do produto pertencem à Carteira Inteligente ou a seus licenciadores. O uso do app não transfere direitos de propriedade intelectual ao usuário.",
          ],
        },
        {
          title: "Limitação de responsabilidade",
          paragraphs: [
            "A Carteira Inteligente organiza dados informados pelo usuário e apresenta cálculos e visualizações com base nessas informações. O app não garante resultado financeiro, aprovação de crédito, rentabilidade, economia ou qualquer resultado específico.",
            "O usuário é responsável por revisar os dados cadastrados e avaliar suas decisões financeiras conforme sua realidade.",
          ],
        },
        {
          title: "Contato",
          paragraphs: [
            "Para dúvidas sobre estes termos, fale com a Carteira Inteligente pelo e-mail contato@acarteirainteligente.com.br.",
          ],
        },
      ]}
    />
  );
}
