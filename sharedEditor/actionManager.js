// Manages actions that are specific to the editor

function addEventListenerAndCaptionActionSubmitForEditor(p_editorCore, p_entriesManager, p_textElement, p_idSubmitElement, p_entry, p_value) {
	const submitElement = getSubmitElementSetValue(p_idSubmitElement, p_value);
	submitElement.addEventListener('click', function(event) {
		if (p_entry == ENTRY.SPACE && p_editorCore != null) {
			applyChangesForSpaceMode(p_editorCore, p_value);	
		}
		setMode(p_textElement, p_entriesManager, p_entry, p_value);
	});
}