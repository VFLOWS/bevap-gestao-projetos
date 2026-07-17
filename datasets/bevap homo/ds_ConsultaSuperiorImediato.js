function createDataset(fields, constraints, sortFields) {
	var newDataset = DatasetBuilder.newDataset();
	var dataSource = "/jdbc/AppDS";
	var conn = null;
	var stmt = null;
	var rs = null;

	try {
		var ic = new javax.naming.InitialContext();
		var ds = ic.lookup(dataSource);
		var created = false;

		var chapa = "";
		var emailUsuario = "";

		if (constraints != null) {
			for (var c = 0; c < constraints.length; c++) {
				var fieldName = String(constraints[c].fieldName).toUpperCase();
				var value = String(constraints[c].initialValue || "").trim();

				if (fieldName == "CHAPA") {
					chapa = value;
				}

				if (fieldName == "EMAIL_USUARIO") {
					emailUsuario = value;
				}
			}
		}

		var myQuery =
			" SELECT * " +
			" FROM VW_APROVADORES_PROJETOS_TI " +
			" WHERE 1 = 1 ";

		var parametros = [];

		if (chapa != "") {
			myQuery += " AND CHAPA = ? ";
			parametros.push(chapa);
		}

		if (emailUsuario != "") {
			myQuery += " AND EMAIL_USUARIO = ? ";
			parametros.push(emailUsuario);
		}

		log.info("[dsConsultaAprovadoresProjetosTI] CHAPA: " + chapa);
		log.info("[dsConsultaAprovadoresProjetosTI] EMAIL_USUARIO: " + emailUsuario);
		log.info("[dsConsultaAprovadoresProjetosTI] QUERY: " + myQuery);

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
			newDataset.addRow([
				"Nenhum registro encontrado na view VW_APROVADORES_PROJETOS_TI."
			]);
		}

	} catch (e) {
		log.error("[dsConsultaAprovadoresProjetosTI] ERRO: " + e);

		newDataset.addColumn("ERRO");
		newDataset.addRow([
			String(e && e.message ? e.message : e)
		]);

	} finally {
		try {
			if (rs != null) rs.close();
		} catch (eRs) {
			log.error("[dsConsultaAprovadoresProjetosTI] Erro ao fechar ResultSet: " + eRs);
		}

		try {
			if (stmt != null) stmt.close();
		} catch (eStmt) {
			log.error("[dsConsultaAprovadoresProjetosTI] Erro ao fechar Statement: " + eStmt);
		}

		try {
			if (conn != null) conn.close();
		} catch (eConn) {
			log.error("[dsConsultaAprovadoresProjetosTI] Erro ao fechar conexão: " + eConn);
		}
	}

	return newDataset;
}