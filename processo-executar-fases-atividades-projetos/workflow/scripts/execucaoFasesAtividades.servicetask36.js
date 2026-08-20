function servicetask36(attempt, message) {
	var FIELD_STATUS = 'statusIntegracaoGLPIAtividade';
	var FIELD_ERROR = 'mensagemErroGLPIAtividade';
	var FIELD_RESPONSE = 'retornoIntegracaoGLPIAtividade';

	try {
		assertForcedGlpiTestError(FIELD_STATUS, FIELD_ERROR, FIELD_RESPONSE);
	} catch (e) {
		var errMsg = formatErrorMessage(e);
		setCardValueSafe(FIELD_STATUS, 'ERROR');
		setCardValueSafe(FIELD_ERROR, errMsg);
		setCardValueSafe(FIELD_RESPONSE, errMsg);
		log.error('Erro forcado na integracao GLPI da atividade: ' + errMsg);
		throw errMsg;
	}

	return true;
}

function assertForcedGlpiTestError(statusField, errorField, responseField) {
	var forceError = '';
	try {
		forceError = asText(hAPI.getCardValue('forcarErroGLPI'));
	} catch (e) {
		forceError = '';
	}

	if (forceError === '1') {
		var message = 'Erro GLPI forcado para teste (forcarErroGLPI=1).';
		if (statusField) {
			setCardValueSafe(statusField, 'ERROR');
		}
		if (errorField) {
			setCardValueSafe(errorField, message);
		}
		if (responseField) {
			setCardValueSafe(responseField, message);
		}
		log.warn(message);
		throw message;
	}
}

function setCardValueSafe(fieldName, value) {
	try {
		hAPI.setCardValue(fieldName, String(value == null ? '' : value));
	} catch (e) {}
}

function asText(value) {
	if (value === null || value === undefined) {
		return '';
	}
	return String(value).replace(/^\s+|\s+$/g, '');
}

function formatErrorMessage(error) {
	var raw = String(error || 'Erro desconhecido');
	if (raw.indexOf('PKIX') >= 0 || raw.indexOf('SSL') >= 0) {
		return 'Falha SSL (PKIX): certificado nao confiavel.';
	}
	return raw;
}
