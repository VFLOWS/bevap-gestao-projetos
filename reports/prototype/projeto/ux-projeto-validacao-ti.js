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
        commentRequired: true,
        redirects: {
            onApprove: '../ux-planejamento.html',
            onReturn: 'ux-execucao-projeto.html',
            onDiscontinue: '../ux-planejamento.html'
        },
        messages: {
            checklistPendingTitle: 'Checklist pendente',
            checklistPendingMessage: 'Conclua o checklist da TI antes de validar o projeto.',
            commentPendingTitle: 'Comentário obrigatório',
            commentPendingMessage: 'Informe o parecer técnico da TI antes de validar o projeto.',
            confirmationPendingTitle: 'Confirmação pendente',
            confirmationPendingMessage: 'Marque a confirmação da TI antes de validar o projeto.',
            approveSuccessTitle: 'Validação concluída',
            approveSuccessMessage: 'A validação da TI foi registrada com sucesso.',
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
