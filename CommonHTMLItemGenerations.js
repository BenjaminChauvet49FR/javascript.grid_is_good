// -------------------------
// Create a submit item

function createSubmitItem(p_stringId, p_captionId) {
	if (!p_captionId) {
		p_captionId = "XXX";
	}
	const submitButton = document.createElement("input");
	submitButton.setAttribute("type", "submit");
	submitButton.setAttribute("id", p_stringId);
	submitButton.setAttribute("value", p_captionId);
	return submitButton;
}


/**
A generic straightforward function
*/
function putActionElementClick(p_idElement, p_eventFunction) {
    document.getElementById(p_idElement).addEventListener('click', p_eventFunction);
}
