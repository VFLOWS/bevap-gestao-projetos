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
		var login = "";
		var chapa = "";
		var email = "";

		if (constraints != null) {
			for (var c = 0; c < constraints.length; c++) {
				if (constraints[c].fieldName == "login") {
					login = constraints[c].initialValue;
				}
				if (constraints[c].fieldName == "chapa") {
					chapa = constraints[c].initialValue;
				}
				if (constraints[c].fieldName == "email") {
					email = constraints[c].initialValue;
				}
			}
		}

		login = sanitizeValue(login);
		chapa = sanitizeValue(chapa);
		email = sanitizeValue(email);

		if (!login && !chapa && !email) {
			newDataset.addColumn("ERRO");
			newDataset.addRow(["Informe a constraint email ou chapa para consultar o usuário no RM."]);
			return newDataset;
		}

		var whereClause = "";
		if (chapa) {
			whereClause = " F.CHAPA = '" + chapa + "' ";
		} else if (email) {
			whereClause = " U.EMAIL = '" + email + "' ";
		} else {
			whereClause = " U.CODUSUARIO = '" + login + "' ";
		}

		var myQuery =
			" SELECT " +
			"     F.CODCOLIGADA, " +
			"     F.CHAPA, " +
			"     F.NOME AS NOME_FUNCIONARIO, " +
			"     U.CODUSUARIO AS LOGIN, " +
			"     P.EMAIL AS EMAIL_PPESSOA, " +
			"     U.EMAIL AS EMAIL_GUSUARIO " +
			" FROM GUSUARIO U " +
			" INNER JOIN PPESSOA P ON P.CODUSUARIO = U.CODUSUARIO " +
			" INNER JOIN PFUNC F ON F.CODPESSOA = P.CODIGO " +
			" WHERE " + whereClause;

		log.info('[dsGetDadosUsuario_RM] myQuery: ' + myQuery);

		conn = ds.getConnection();
		stmt = conn.createStatement();
		rs = stmt.executeQuery(myQuery);
		var columnCount = rs.getMetaData().getColumnCount();

		while (rs.next()) {
			if (!created) {
				for (var i = 1; i <= columnCount; i++) {
					newDataset.addColumn(rs.getMetaData().getColumnName(i));
				}
				created = true;
			}

			var arr = new Array();
			for (var j = 1; j <= columnCount; j++) {
				var columnName = rs.getMetaData().getColumnName(j);
				var obj = rs.getObject(columnName);
				arr[j - 1] = obj != null ? obj.toString() : "";
			}
			newDataset.addRow(arr);
		}
	} catch (e) {
		log.error("[dsGetDadosUsuario_RM] ERRO: " + e.message);
		newDataset.addColumn("ERRO");
		newDataset.addRow([e.message]);
	} finally {
		if (rs != null) rs.close();
		if (stmt != null) stmt.close();
		if (conn != null) conn.close();
	}

	return newDataset;
}

function sanitizeValue(value) {
	return String(value == null ? "" : value).replace(/'/g, "''").trim();
}
