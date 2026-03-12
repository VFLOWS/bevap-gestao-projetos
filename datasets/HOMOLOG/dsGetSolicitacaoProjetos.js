function createDataset(fields, constraints, sortFields) {

    var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/FluigDS";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;

    var queryFilter = "";
    var sqlLimit = null;
    var shouldGroups = {};
        var selectFields = "";

    var baseTable = "ML001543729";
    var targetTable = baseTable;

    function padLeft(value, width) {
        var s = value.toString();
        while (s.length < width) {
            s = "0" + s;
        }
        return s;
    }

    
    var parentFields = [];
    var childFieldsMap = {}; 
    
    if (fields != null && fields.length > 0) {
    
        for (var f = 0; f < fields.length; f++) {
    
            var fieldName = fields[f] + "";
    
            if (fieldName.indexOf(".") > -1) {
    
                var parts = fieldName.split(".");
                var tableAlias = parts[0];
                var columnName = parts[1];
    
                if (!childFieldsMap[tableAlias]) {
                    childFieldsMap[tableAlias] = [];
                }
    
                childFieldsMap[tableAlias].push(columnName);
    
            } else {
                parentFields.push(fieldName);
            }
        }
    
        selectFields = parentFields.length > 0 ? parentFields.join(", ") : "PRINCIPAL.*";
    
    } else {
        selectFields = "PRINCIPAL.*";
    }

    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) 
        {
                        var constraintName = constraints[i].fieldName + "";
            var lowerName = constraintName.toLowerCase();

            if (lowerName.indexOf("metadata") !== -1) {
                continue;
            }

            if (lowerName === "sqllimit") {
                sqlLimit = constraints[i].initialValue + "";
                continue;
            }

            if (lowerName === "tablename") {
                var value = constraints[i].initialValue + "";
                if (value && value !== "") {
                    if(value.indexOf("ML001") === 0) {
                        baseTable = value;
                        targetTable = value;
                    } else {
                        baseTable = "ML001" + value;
                        targetTable = "ML001" + value;
                    }
                }
                continue;
            }

            var constraintValue = constraints[i].initialValue + "";
            var finalValue = constraints[i].finalValue + "";
            var constraintType = constraints[i].constraintType;
            var likeSearch = constraints[i].likeSearch;

            var hasRange = finalValue && finalValue !== "" && finalValue !== constraintValue;
            var safeValue = constraintValue.replace(/%/g, ""); 
            var safeFinal = finalValue.replace(/%/g, "");

            if(constraintName.indexOf(".") < 0) {
                constraintName = "PRINCIPAL." + constraintName;
            }

            switch (constraintType) {
                case ConstraintType.MUST:
                    if (hasRange) {
                        queryFilter += " AND " + constraintName + " BETWEEN '" + constraintValue + "' AND '" + finalValue + "' ";
                    } else if (likeSearch) {
                        queryFilter += " AND " + constraintName + " LIKE '%" + safeValue + "%' ";
                    } else {
                        queryFilter += " AND " + constraintName + " = '" + constraintValue + "' ";
                    }
                    break;
                case ConstraintType.MUST_NOT:
                    if (hasRange) {
                        queryFilter += " AND " + constraintName + " NOT BETWEEN '" + constraintValue + "' AND '" + finalValue + "' ";
                    } else if (likeSearch) {
                        queryFilter += " AND " + constraintName + " NOT LIKE '%" + safeValue + "%' ";
                    } else {
                        queryFilter += " AND " + constraintName + " <> '" + constraintValue + "' ";
                    }
                    break;
                case ConstraintType.SHOULD:
                    if (!shouldGroups[constraintName]) {
                        shouldGroups[constraintName] = [];
                    }
                    if (hasRange) {
                        shouldGroups[constraintName].push(constraintName + " BETWEEN '" + constraintValue + "' AND '" + finalValue + "' ");
                    } else if (likeSearch) {
                        shouldGroups[constraintName].push(constraintName + " LIKE '%" + safeValue + "%' ");
                    } else {
                        shouldGroups[constraintName].push(constraintName + " = '" + constraintValue + "' ");
                    }
                    break;
            }
        }

        for (var field in shouldGroups) {
            if (shouldGroups.hasOwnProperty(field)) {
                queryFilter += " AND (" + shouldGroups[field].join(" OR ") + ") ";
            }
        }
    }

    if (sortFields != null && sortFields.length > 0) {
        queryFilter += " ORDER BY ";    
        for (var s = 0; s < sortFields.length; s++) {
            var sorting = sortFields[s]
            var field = sorting.indexOf(";") >= 0 ? sorting.split(";")[0] : sorting.split(" ")[0];
            var direction = sorting.indexOf(";") >= 0 ? sorting.split(";")[1] : (sorting.split(" ")[1] || "ASC");
            queryFilter += field + " " + direction;
            if (s < sortFields.length - 1) {
                queryFilter += ", "
            }
        }
    }

    var topClause = "";
    if (sqlLimit != null && sqlLimit !== "") {
        var sqlLimitNumber = parseInt(sqlLimit, 10);
        if (!isNaN(sqlLimitNumber) && sqlLimitNumber > 0) {
            topClause = "TOP " + sqlLimitNumber + " ";
        }
    }

    var tablesPaiFilho = getTablesPaiFilho(baseTable);
    var dynamicJsonSelect = "";
    
    for (var t = 0; t < tablesPaiFilho.length; t++) {
    
        var codListaFilho = tablesPaiFilho[t].codListaFilho;
        var codTabela = tablesPaiFilho[t].codTabela;
    
        if (codListaFilho != null && codTabela != null) {
    
            var childTableName = "ML001" + codListaFilho;
    
            var childFields = "*";
    
            if (childFieldsMap[codTabela] && childFieldsMap[codTabela].length > 0) {
                childFields = childFieldsMap[codTabela].join(", ");
            }
    
            dynamicJsonSelect += 
                ", ( " +
                "    SELECT " + childFields +
                "    FROM " + childTableName + " CHILD " +
                "    WHERE CHILD.MASTERID = PRINCIPAL.ID " +
                "    FOR JSON PATH " +
                ") AS [" + codTabela + "] ";
        }
    }
    
    

   var myQuery = 
       "SELECT " + topClause + selectFields + dynamicJsonSelect + " " +
       ",( SELECT CONCAT(HP.NUM_SEQ_ESTADO,' - ',EP.DES_ESTADO) " +
        "FROM HISTOR_PROCES AS HP " +
        "INNER JOIN ESTADO_PROCES AS EP ON  EP.NUM_SEQ = HP.NUM_SEQ_ESTADO " +
        "WHERE HP.NUM_PROCES = PWS.NUM_PROCES " +
        "AND EP.COD_DEF_PROCES = PWS.COD_DEF_PROCES " +
        "AND EP.NUM_VERS = PWS.NUM_VERS " +
        "AND HP.LOG_ATIV = 1 " +
        ") AS estadoProcesso " +
        "FROM " + targetTable + " AS PRINCIPAL " +
        "INNER JOIN DOCUMENTO AS DOC "+
        "    ON PRINCIPAL.documentid = DOC.NR_DOCUMENTO "+
        "   AND PRINCIPAL.version = DOC.NR_VERSAO "+
        "INNER JOIN PROCES_WORKFLOW PWS " +
        "ON PWS.NR_DOCUMENTO_CARD = PRINCIPAL.documentid " +
        "WHERE DOC.VERSAO_ATIVA = 1 " +
        queryFilter;

    log.info("$$DEBUG ds_rastreabilidade_RH_detalhamento myQuery: ")
    log.info(myQuery)

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
                    Arr[i - 1] = obj.toString();
                } else {
                    Arr[i - 1] = "null";
                }
            }
            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("$$DEBUG ds_rastreabilidade_RH_detalhamento ERRO:" + e.message);
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



function getTablesPaiFilho(tableId) 
{
    var tables = [];
    var dataSource = "/jdbc/FluigDS";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);

    var codMl = tableId.replace('ML001', '');

    var query = "SELECT   " +
                "  l.COD_LISTA_FILHO,  " +
                "  l.COD_TABELA  " +
                "FROM DOCUMENTO  " +
                "LEFT JOIN META_LISTA_REL l ON l.COD_LISTA_PAI = DOCUMENTO.COD_LISTA  " +
                "WHERE DOCUMENTO.VERSAO_ATIVA = 1    " +
                "AND LTRIM(RTRIM(DOCUMENTO.NM_DATASET)) <> ''  " +
                "AND DOCUMENTO.NM_DATASET IS NOT NULL " +
                "AND DOCUMENTO.COD_LISTA LIKE '%" + codMl + "%'"
        
    log.info("$$DEBUG getTablesPaiFilho myQuery")
    log.info(query)

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(query);
        while (rs.next()) {
            tables.push({
                codListaFilho: rs.getString("COD_LISTA_FILHO"),
                codTabela: rs.getString("COD_TABELA")
            });
        }
    } catch (e) {
        log.error("$$DEBUG getTablesPaiFilho ERRO:" + e.message);
    }
    finally {

        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
    return tables;

}