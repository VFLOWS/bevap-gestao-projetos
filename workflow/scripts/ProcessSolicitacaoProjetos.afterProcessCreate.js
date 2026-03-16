function afterProcessCreate(processId){

	var attachments = hAPI.listAttachments();

	var jsonAttachments = [];
	var gson = new com.google.gson.Gson();

	for (var i = 0; i < attachments.size(); i++) {
        var attachment = attachments.get(i);

        jsonAttachments.push({
			documentId: attachment.getDocumentId(),
			fileName: attachment.getDocumentDescription(),
			version: attachment.getVersion(),
			createdAt: attachment.getCreateDate(),
			fileSize: attachment.getPhisicalFileSize()
		});
    }

	var attachmentsString = gson.toJson(jsonAttachments);

	hAPI.setCardValue("anexosNS", attachmentsString);
}