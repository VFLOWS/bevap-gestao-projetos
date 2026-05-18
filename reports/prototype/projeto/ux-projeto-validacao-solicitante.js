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
            commentPendingTitle: 'Comentario obrigatorio',
            commentPendingMessage: 'Informe o parecer do solicitante antes de validar o projeto.',
            confirmationPendingTitle: 'Confirmacao pendente',
            confirmationPendingMessage: 'Marque a confirmacao do solicitante antes de validar o projeto.',
            approveSuccessTitle: 'Projeto validado',
            approveSuccessMessage: 'A validacao do solicitante foi registrada e o projeto seguira para a TI.',
            returnPendingTitle: 'Campo obrigatorio',
            returnPendingMessage: 'Informe o motivo da devolucao.',
            returnSuccessTitle: 'Projeto devolvido',
            returnSuccessMessage: 'O projeto retornou para a execucao para ajustes.',
            discontinuePendingTitle: 'Campos obrigatorios',
            discontinuePendingMessage: 'Selecione a categoria e descreva o motivo.',
            discontinueSuccessTitle: 'Nao continuidade registrada',
            discontinueSuccessMessage: 'A nao continuidade foi registrada e os stakeholders serao notificados.'
        }
    });
});
