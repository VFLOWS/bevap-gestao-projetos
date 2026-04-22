function createDataset(fields, constraints, sortFields) {
    var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/RM";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;

    var cSql = "select * from GCCUSTO C where c.ATIVO = 'T' AND LEN(C.CODCCUSTO) > 9 AND C.CODCCUSTO NOT LIKE '0.%' AND C.CODCLASSIFICA IS NOT NULL AND C.CODCOLIGADA = 1";

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(cSql);
        //var rs = stmt.executeUpdate(myQuery);   

        log.info('CHEGOU AQUI')

        // newDataset.addRow(new Array(rs.toString()));

        log.info('CHEGOU AQUI ---2')

        var columnCount = rs.getMetaData().getColumnCount();

        log.info('CHEGOU AQUI ---3')
        log.dir(columnCount)
        while (rs.next()) {

            if (!created) {
				for (var i = 1; i <= columnCount; i++) {
					newDataset.addColumn(rs.getMetaData().getColumnName(i));
				}
				newDataset.addColumn("ZOOM");
				created = true;
			}
			var Arr = new Array();
			for (var i = 1; i <= columnCount; i++) {
				var obj = rs.getObject(rs.getMetaData().getColumnName(i));
				if (null != obj) {
					Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString().trim();
				}
				else {
					Arr[i - 1] = "null";
				}
			}
			
			Arr.push("" + Arr[1] + " " + "-" + " " + Arr[2]);
			log.info("retorno do banco");
			log.dir(Arr);

			// Arr.unshift(Arr.join(' | '));

			newDataset.addRow(Arr);
        }
    } catch (e) {
        newDataset.addColumn("ERRO");
        newDataset.addRow(new Array(e.message));
        //       log.error("ERRO==============> " + e.message);
    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
    return newDataset;
}