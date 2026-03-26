function defineStructure() {
	addColumn("codforn");
	addColumn("nomeFantasia");
	addColumn("nomec");
	addColumn("rua");
	addColumn("bairro");
	addColumn("cidade");
	addColumn("incEstadual");
	addColumn("cep");
	addColumn("complemento");
	addColumn("email");
	addColumn("uf");
	addColumn("cnpj");
	
	setKey([ "codforn" ]);
	addIndex([ "codforn" ]);
	addIndex([ "nomeFantasia" ]);
	addIndex([ "nomec" ]);
	addIndex([ "rua" ]);
	addIndex([ "bairro" ]);
	addIndex([ "cidade" ]);
	addIndex([ "incEstadual" ]);
	addIndex([ "cep" ]);
	addIndex([ "complemento" ]);
	addIndex([ "email" ]);
	addIndex([ "uf" ]);
	addIndex([ "cnpj" ]);
}

function onSync(lastSyncDate) {

}

function createDataset(fields, constraints, sortFields) {
	var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/RM"; 
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    
    var myQuery = "SELECT " +
	    		"f.CODCFO AS codforn, " +
	    		"f.NOMEFANTASIA AS nomeFantasia, "+
	    		"CONCAT(f.CODCFO,'-', f.NOME) AS nomec, "+
	    		"f.RUA AS rua, "+ 
	    		"f.BAIRRO AS bairro, "+
	    		"f.CIDADE AS cidade, "+
	    		"f.INSCRESTADUAL AS incEstadual, " +
	    		"f.CEP AS cep, "+
	    		"f.COMPLEMENTO AS complemento, "+
	    		"f.EMAIL AS email, "+
	    		"f.CODETDPGTO AS uf, "+ 
	    		"f.CGCCFO AS cnpj "+
    		"FROM FCFO f "; 

    log.info("QUERY: " + myQuery);    
    
    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(myQuery);
        var columnCount = rs.getMetaData().getColumnCount();
        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }
            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var obj = rs.getObject(rs.getMetaData().getColumnName(i));
                if (null != obj) {
                    Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString();
                } else {
                    Arr[i - 1] = "null";
                }
            }
            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
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

function onMobileSync(user) {

}