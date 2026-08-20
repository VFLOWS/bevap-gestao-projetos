function createDataset(fields, constraints, sortFields) {
    var ds = DatasetBuilder.newDataset();
    ds.addColumn("status");
    ds.addColumn("hasSubstitute");
    ds.addColumn("userId");
    ds.addColumn("message");
    ds.addColumn("rawResponse");

    var userId = "";

    for (var i = 0; constraints && i < constraints.length; i++) {
        if (String(constraints[i].fieldName || "") === "colleagueId") {
            userId = String(constraints[i].initialValue || "").trim();
        }
    }

    if (!userId) {
        ds.addRow(["ERROR", "false", "", "Informe a constraint colleagueId.", ""]);
        return ds;
    }

    try {
        var endpoint = "/api/public/bpm/substituteUser/getValidSubstituteOfUser/" +
            "1/" + encodeURIComponent(String(userId));
        var raw = callFluigRest(endpoint);
        var content = raw ? JSON.parse(raw).content : [];
        var hasSubstitute = content && content.length > 0;

        ds.addRow([
            "OK",
            hasSubstitute ? "true" : "false",
            userId,
            hasSubstitute ? "Substituto localizado." : "Usuário sem substituto valído.",
            raw
        ]);
    } catch (e) {
        ds.addRow(["ERROR", "false", userId, String(e), ""]);
    }

    return ds;
}

function callFluigRest(endpoint) {
    var response = fluigAPI.getAuthorizeClientService().invoke(JSONUtil.toJSON({
        companyId: "1",
        serviceCode: "fluig_rest",
        endpoint: endpoint,
        method: "get",
        timeoutService: "120",
        options: {
            encoding: "UTF-8",
            mediaType: "application/json",
            headers: { Accept: "application/json" }
        }
    }));

    return response && response.getResult ? String(response.getResult() || "") : "";
}
