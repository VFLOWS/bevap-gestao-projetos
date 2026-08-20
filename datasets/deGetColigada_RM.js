function createDataset(fields, constraints, sortFields){
try{
		log.info("Inicio dataset ds_criappr_buscaColigadas: ");
		
		var codColigada, filtro;
		
		 if(constraints != '' && constraints != null){
				for(var i=0;i<constraints.length;i++){
					if(constraints[i].fieldName == "CODCOLIGADA"){
						codColigada = constraints[i].initialValue;
					}
				}
			}
		 
		 if (!codColigada) {
			 filtro = "1=1 AND CODCOLIGADA <> 0 ";
		}else{
			filtro = "CODCOLIGADA="+codColigada;
		}
		
		var soapService = ServiceManager.getServiceInstance('RM DataServer');
		var instancia = soapService.instantiate("com.totvs.WsDataServer");
		var ws = instancia.getRMIwsDataServer();		
		var serviceHelper = soapService.getBean();
		var authService = serviceHelper.getBasicAuthenticatedClient(ws, "com.totvs.IwsDataServer", 'svc.totvs.fluig', '5ZsRsaj583zf');
		var contexto = "CODUSUARIO=svc.totvs.fluig;CODSISTEMA=V";
		var retorno = authService.readView("GlbColigadaData", filtro, contexto);
		
		var xmlResultados = new XML(retorno);

		var dataset = DatasetBuilder.newDataset();   
	             dataset.addColumn('CODCOLIGADA'); 
	             dataset.addColumn('NOMEFANTASIA'); 
	             dataset.addColumn('CGC'); 
	             dataset.addColumn('NOME');
	    for(var i = 0; i < xmlResultados.GColigada.length(); i++) 
	    { 
	           dataset.addRow(new Array( 
	             xmlResultados.GColigada[i].CODCOLIGADA.toString(), 
	             xmlResultados.GColigada[i].NOMEFANTASIA.toString(), 
	             xmlResultados.GColigada[i].CGC.toString(), 
	             xmlResultados.GColigada[i].NOME.toString()
										))}
} catch (e) {
    log.error("Erro no dataset ds_criappr_buscaColigadas: " + e.message);
    if (e.javaException) {
        log.error("Stack trace: " + e.javaException.getMessage());
        var stack = e.javaException.getStackTrace();
        for (var i = 0; i < stack.length; i++) {
            log.error(stack[i].toString());
        }
    }
    dataset.addColumn("erro");
    dataset.addRow([e.message]);
} finally {
	soapService = null;
    instancia = null;
    ws = null;
    serviceHelper = null;
    authService = null;
}
	log.info("Fim dataset ds_criappr_buscaColigadas");
		return dataset;

}