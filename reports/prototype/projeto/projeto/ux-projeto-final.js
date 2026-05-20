document.addEventListener('DOMContentLoaded', function () {
    window.initProjectValidationPage({
        checklist: {
            itemSelector: '.validation-checklist-item',
            percentageId: 'validation-checklist-percentage',
            progressId: 'validation-checklist-progress',
            noticeId: 'execution-checklist-notice',
            noticeByIncomplete: true
        },
        feedbackId: 'final-readonly-feedback',
        agreementId: 'final-readonly-agreement',
        commentRequired: false,
        redirects: {},
        messages: {
            checklistPendingTitle: '',
            checklistPendingMessage: '',
            commentPendingTitle: '',
            commentPendingMessage: '',
            confirmationPendingTitle: '',
            confirmationPendingMessage: '',
            approveSuccessTitle: '',
            approveSuccessMessage: '',
            returnPendingTitle: '',
            returnPendingMessage: '',
            returnSuccessTitle: '',
            returnSuccessMessage: '',
            discontinuePendingTitle: '',
            discontinuePendingMessage: '',
            discontinueSuccessTitle: '',
            discontinueSuccessMessage: ''
        }
    });
});
