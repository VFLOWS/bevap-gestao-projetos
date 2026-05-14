/**
 * DEBUG: Descobrir qual é o ID correto da atividade de Planejamento
 * Adicione este script como um Event Script em afterStateLeave e veja no log
 */
function afterStateLeave(sequenceId) {
    var atividade = getValue("WKNumState");
    var activityName = getValue("WKState");
    
    log.warn("=== DEBUG ATIVIDADE ===");
    log.warn("WKNumState (ID): " + atividade);
    log.warn("WKState (Nome): " + activityName);
    log.warn("sequenceId: " + sequenceId);
    log.warn("=== FIM DEBUG ===");
}
