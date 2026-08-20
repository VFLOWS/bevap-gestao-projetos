function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();
    
    dataset.addColumn("documentId");
    dataset.addColumn("downloadURL");

    var documentId = "112587";

    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "documentId") {
                documentId = constraints[i].initialValue;
            }
        }
    }

    try {

        var clientService = fluigAPI.getAuthorizeClientService();

        var data = {
            companyId: getValue("WKCompany") + '',
            serviceCode: "fluig_rest",
            endpoint: "/api/public/ecm/document/downloadURL/" + documentId,
            method: "get",
            timeoutService: "100",
            options: {
                encoding: "UTF-8",
                mediaType: "application/json"
            }
        };

        var response = clientService.invoke(JSONUtil.toJSON(data));

        if (response.getResult() != null && response.getResult() != "") {

            var result = JSON.parse(response.getResult());

            var fileURL = result.content;

            dataset.addRow([documentId, fileURL]);
        }

    } catch (e) {
        dataset.addRow(["erro", e.message]);
    }

    return dataset;
}