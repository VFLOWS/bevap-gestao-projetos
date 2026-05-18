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
            commentPendingTitle: 'Comentario obrigatorio',
            commentPendingMessage: 'Informe o parecer tecnico da TI antes de validar o projeto.',
            confirmationPendingTitle: 'Confirmacao pendente',
            confirmationPendingMessage: 'Marque a confirmacao da TI antes de validar o projeto.',
            approveSuccessTitle: 'Validacao concluida',
            approveSuccessMessage: 'A validacao da TI foi registrada com sucesso.',
            returnPendingTitle: 'Campo obrigatorio',
            returnPendingMessage: 'Informe o motivo da devolucao.',
            returnSuccessTitle: 'Devolvido para correcao',
            returnSuccessMessage: 'O projeto retornou para a execucao para ajustes.',
            discontinuePendingTitle: 'Campos obrigatorios',
            discontinuePendingMessage: 'Selecione a categoria e descreva o motivo.',
            discontinueSuccessTitle: 'Nao continuidade registrada',
            discontinueSuccessMessage: 'A nao continuidade foi registrada e os stakeholders serao notificados.'
        }
    });
});
