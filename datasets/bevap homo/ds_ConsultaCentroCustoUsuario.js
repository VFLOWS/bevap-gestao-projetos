function createDataset(fields, constraints, sortFields) {
	var newDataset = DatasetBuilder.newDataset();
	var dataSource = "/jdbc/RM";
	var conn = null;
	var stmt = null;
	var rs = null;

	try {
		var ic = new javax.naming.InitialContext();
		var ds = ic.lookup(dataSource);
		var created = false;

		var emailUsuario = "";
		var codColigada = "";

		if (constraints != null) {
			for (var c = 0; c < constraints.length; c++) {
				var fieldName = String(constraints[c].fieldName).toUpperCase();
				var value = String(constraints[c].initialValue || "").trim();

				if (fieldName == "EMAILUSUARIO") {
					emailUsuario = value;
				}

				if (fieldName == "CODCOLIGADA") {
					codColigada = value;
				}
			}
		}

		emailUsuario = sanitizeEmail(emailUsuario);
		codColigada = sanitizeNumber(codColigada);

		var myQuery =
			" SELECT " +
			"     U.CODUSUARIO, " +
			"     U.NOME AS NOME_USUARIO, " +
			"     U.EMAIL, " +
			"     UC.CODCOLIGADA, " +
			"     UC.CODCCUSTO, " +
			"     CC.NOME AS NOME_CENTRO_CUSTO " +
			" FROM GUSUARIO U " +
			" INNER JOIN TUSUARIOCCUSTO UC " +
			"     ON UC.CODUSUARIO = U.CODUSUARIO " +
			" INNER JOIN GCCUSTO CC " +
			"     ON CC.CODCOLIGADA = UC.CODCOLIGADA " +
			"    AND CC.CODCCUSTO = UC.CODCCUSTO " +
			" WHERE U.STATUS = 1 ";

		var parametros = [];

		if (emailUsuario) {
			myQuery += " AND U.EMAIL = ? ";
			parametros.push(emailUsuario);
		}

		if (codColigada) {
			myQuery += " AND UC.CODCOLIGADA = ? ";
			parametros.push(codColigada);
		}

		myQuery += " ORDER BY UC.CODCOLIGADA, UC.CODCCUSTO ";

		log.info("[dsConsultaCentroCustoUsuario_RM] emailUsuario: " + emailUsuario);
		log.info("[dsConsultaCentroCustoUsuario_RM] codColigada: " + codColigada);
		log.info("[dsConsultaCentroCustoUsuario_RM] myQuery: " + myQuery);

		conn = ds.getConnection();
		stmt = conn.prepareStatement(myQuery);

		for (var p = 0; p < parametros.length; p++) {
			stmt.setString(p + 1, parametros[p]);
		}

		rs = stmt.executeQuery();

		var metaData = rs.getMetaData();
		var columnCount = metaData.getColumnCount();

		while (rs.next()) {
			if (!created) {
				for (var i = 1; i <= columnCount; i++) {
					newDataset.addColumn(metaData.getColumnName(i));
				}
				created = true;
			}

			var arr = [];

			for (var j = 1; j <= columnCount; j++) {
				var obj = rs.getObject(j);
				arr[j - 1] = obj != null ? obj.toString() : "";
			}

			newDataset.addRow(arr);
		}

		if (!created) {
			newDataset.addColumn("RETORNO");
			newDataset.addRow(["Nenhum centro de custo encontrado."]);
		}

	} catch (e) {
		log.error("[dsConsultaCentroCustoUsuario_RM] ERRO: " + e);
		newDataset.addColumn("ERRO");
		newDataset.addRow([String(e && e.message ? e.message : e)]);
	} finally {
		if (rs != null) rs.close();
		if (stmt != null) stmt.close();
		if (conn != null) conn.close();
	}

	return newDataset;
}

function sanitizeEmail(value) {
	var normalized = String(value == null ? "" : value).trim();

	if (!normalized) {
		return "";
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
		return "";
	}

	return normalized;
}

function sanitizeNumber(value) {
	var normalized = String(value == null ? "" : value).trim();

	if (!normalized) {
		return "";
	}

	if (!/^\d+$/.test(normalized)) {
		return "";
	}

	return normalized;
}