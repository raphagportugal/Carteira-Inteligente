import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade da Carteira Inteligente.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidade"
      title="Política de Privacidade"
      description="Esta política explica como a Carteira Inteligente trata dados pessoais e informações financeiras cadastradas voluntariamente pelo usuário para organização financeira."
      updatedAt="25 de junho de 2026"
      sections={[
        {
          title: "Quem somos",
          paragraphs: [
            "A Carteira Inteligente é uma plataforma de organização financeira pessoal. Nosso objetivo é ajudar pessoas a entender para onde o dinheiro está indo, quanto realmente possuem disponível e como planejar objetivos financeiros com mais clareza.",
          ],
        },
        {
          title: "Quais dados coletamos",
          paragraphs: [
            "Coletamos apenas informações necessárias para criar sua conta, autenticar seu acesso e organizar os dados financeiros que você decide cadastrar manualmente no aplicativo.",
          ],
          items: [
            "Dados de cadastro, como nome, e-mail e informações necessárias para autenticação.",
            "Informações financeiras cadastradas pelo usuário, como contas, saldos, movimentações, categorias, valores, datas, objetivos financeiros, investimentos cadastrados manualmente, parcelamentos, financiamentos e mensalidades.",
            "Dados técnicos básicos, como informações de dispositivo, registros técnicos de acesso, logs de erro e informações necessárias para segurança e funcionamento do serviço.",
          ],
        },
        {
          title: "O que não coletamos",
          paragraphs: [
            "A Carteira Inteligente não solicita nem armazena credenciais bancárias ou dados completos de pagamento. Nesta versão, não há integração automática com instituições financeiras.",
          ],
          items: [
            "Não solicitamos senha bancária.",
            "Não solicitamos login de banco ou credenciais de internet banking.",
            "Não coletamos número completo de cartão de crédito.",
            "Não coletamos CVV.",
            "Não acessamos contas bancárias externas.",
            "Não importamos automaticamente dados de instituições financeiras.",
            "Não usamos Open Finance nesta versão. Caso isso seja implementado futuramente, informaremos o usuário com clareza antes do uso.",
            "Não vendemos dados pessoais.",
          ],
        },
        {
          title: "Para que usamos os dados",
          items: [
            "Permitir o funcionamento do aplicativo.",
            "Calcular fluxo de caixa, compromissos e projeções com base nos dados cadastrados pelo usuário.",
            "Organizar objetivos financeiros, investimentos, parcelamentos, financiamentos e mensalidades.",
            "Exibir dashboards e históricos financeiros.",
            "Autenticar usuários e proteger o acesso à conta.",
            "Melhorar segurança, estabilidade e suporte.",
          ],
        },
        {
          title: "Login com Google",
          paragraphs: [
            "Quando o usuário escolhe entrar com Google, podemos receber informações disponibilizadas pelo Google para autenticação, como nome, e-mail e foto de perfil. Essas informações são usadas para criar ou acessar a conta do usuário na Carteira Inteligente.",
          ],
        },
        {
          title: "Compartilhamento com terceiros",
          paragraphs: [
            "Usamos provedores necessários para operar o serviço. Compartilhamos dados apenas quando isso é necessário para autenticação, armazenamento, segurança, suporte ou funcionamento da plataforma.",
          ],
          items: [
            "Supabase, para autenticação e banco de dados.",
            "Google, para autenticação, quando o usuário escolher esse método de login.",
            "Provedores de e-mail transacional, para mensagens relacionadas à conta, suporte e recuperação de senha.",
            "Futuramente, um gateway de pagamento poderá ser usado para cobrança de assinatura. Valores e condições serão apresentados antes de qualquer cobrança.",
          ],
        },
        {
          title: "Segurança",
          paragraphs: [
            "Adotamos medidas técnicas e organizacionais para proteger o acesso às contas e reduzir riscos de acesso indevido. Nenhum sistema é absolutamente imune a falhas, mas trabalhamos para manter uma base segura e responsável.",
          ],
          items: [
            "Uso de HTTPS.",
            "Autenticação de usuários.",
            "Row Level Security e isolamento por usuário no Supabase.",
            "Controles para impedir acesso cruzado entre contas de usuários.",
          ],
        },
        {
          title: "Direitos do usuário",
          items: [
            "Acessar as informações cadastradas.",
            "Corrigir dados da conta ou informações financeiras cadastradas.",
            "Solicitar exclusão de dados, quando aplicável.",
            "Revogar consentimento quando aplicável.",
            "Entrar em contato para dúvidas sobre privacidade.",
          ],
        },
        {
          title: "Contato",
          paragraphs: [
            "Para dúvidas, solicitações ou assuntos relacionados a privacidade, entre em contato pelo e-mail contato@acarteirainteligente.com.br.",
            "Esta política poderá ser atualizada conforme o produto evoluir.",
          ],
        },
      ]}
    />
  );
}
