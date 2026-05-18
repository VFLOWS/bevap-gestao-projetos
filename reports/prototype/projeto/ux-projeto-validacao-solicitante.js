document.addEventListener('DOMContentLoaded', function () {
    window.initProjectValidationPage({
        checklist: {
            itemSelector: '.validation-checklist-item',
            percentageId: 'validation-checklist-percentage',
            progressId: 'validation-checklist-progress',
            noticeId: 'execution-checklist-notice'
        },
        feedbackId: 'validation-feedback-text',
        agreementId: 'validation-agreement-checkbox',
        commentRequired: false,
        redirects: {
            onApprove: 'ux-projeto-validacao-ti.html',
            onReturn: 'ux-execucao-projeto.html',
            onDiscontinue: '../ux-planejamento.html'
        },
        messages: {
            checklistPendingTitle: 'Checklist pendente',
            checklistPendingMessage: 'Conclua o checklist do solicitante antes de validar o projeto.',
            commentPendingTitle: 'Comentário obrigatório',
            commentPendingMessage: 'Informe o parecer do solicitante antes de validar o projeto.',
            confirmationPendingTitle: 'Confirmação pendente',
            confirmationPendingMessage: 'Marque a confirmação do solicitante antes de validar o projeto.',
            approveSuccessTitle: 'Projeto validado',
            approveSuccessMessage: 'A validação do solicitante foi registrada e o projeto seguirá para a TI.',
            returnPendingTitle: 'Campo obrigatório',
            returnPendingMessage: 'Informe o motivo do novo planejamento.',
            returnSuccessTitle: 'Novo planejamento solicitado',
            returnSuccessMessage: 'O projeto retornou para a etapa de planejamento para revisão.',
            discontinuePendingTitle: 'Campos obrigatórios',
            discontinuePendingMessage: 'Selecione a categoria e descreva o motivo.',
            discontinueSuccessTitle: 'Não continuidade registrada',
            discontinueSuccessMessage: 'A não continuidade foi registrada e os stakeholders serão notificados.'
        }
    });
});
