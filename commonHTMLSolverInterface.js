// ------------------------
// Global

/* Building HTML - Actions global. Final look :
Actions globales : </br>
<input type="submit" id="submit_multiPass" value="Multipasse"></input></br>
<input type="submit" id="submit_undo" value="Annuler"></input></br>	
<span id="span_resolution_state"></span></br>	

p_idGlobalActions is in HTML
p_listIDs and p_listActions must have the same length
*/
function buildActionsGlobal(p_idGlobalActions, p_listCaptions, p_listFunctions) {
	const mainDiv = document.getElementById(p_idGlobalActions);
	mainDiv.append(document.createTextNode("Actions globales"));
	mainDiv.append(document.createElement("br"));
	var id;
	for (var i = 0 ; i < p_listCaptions.length ; i++) {
		id = p_idGlobalActions + "_submit" + i
		mainDiv.appendChild(createSubmitItem(id, p_listCaptions[i]));
		putActionElementClick(id, p_listFunctions[i]);
	}
}


/* Building HTML - Puzzle management. Final look :
Grille à charger : <input type="text" id="input_grid_name" value="1"></input> 
<input type="submit" id="submit_view_puzzle_list" value="Voir les puzzles Shugaku"></input></br>
<input type="submit" id="submit_load_grid" value="Charger"></input></br> 
*/
function buildPuzzleManagementMenu(p_idGlobal, p_idTextLoad, p_idButtonLoad, p_puzzleName, p_defaultValue) {
	const mainDiv = document.getElementById(p_idGlobal);
	mainDiv.append(document.createTextNode("Grille à charger : "));
	const fieldName = document.createElement("input");
	fieldName.setAttribute("id", p_idTextLoad);
	fieldName.setAttribute("value", p_defaultValue);
	fieldName.setAttribute("type", "text");
	mainDiv.append(fieldName);
	mainDiv.append(document.createElement("br"));
	mainDiv.appendChild(createSubmitItem("submit_view_puzzle_list", "Voir les puzzles " + p_puzzleName));
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(p_puzzleName)});
	mainDiv.appendChild(createSubmitItem(p_idButtonLoad, "Charger"));
}

/* Building HTML - Quickstart. Final look :
<input type="submit" id="submit_quickStart" value="Démarrage rapide"></input></br>
*/

// Revolution ! Should be replaced in term.
function buildQuickStart(p_idGlobal, p_quickStartMethod) { 
	const mainDiv = document.getElementById(p_idGlobal);
	mainDiv.appendChild(createSubmitItem("submit_quickStart", "Démarrage rapide"));
	putActionElementClick("submit_quickStart", p_quickStartMethod);
}

// ------------------------------
// Canvas actions items

/* Building HTML. Final look :
<Action case : <span id="p_divId_span"></span></br>
<input type="submit" id="p_divId_submit1" value="XXX"></input>
<input type="submit" id="p_divId_submit2" value="XXX"></input>
<input type="submit" id="p_divId_submit3" value="XXX"></input></br>*/

// This method also generates an HTML item, in addition to bind action listeners to it
function buildInputCanvas(p_divId, p_entriesManager, p_actionText, p_entry, p_actions) {  
	const mainDiv = document.getElementById(p_divId);
	var ids = [];
	var submitButton;
	mainDiv.appendChild(document.createTextNode("Action " + p_actionText + " : "));
	const spanElt = document.createElement("span");
	const modeSpanId = p_divId + "_span";
	spanElt.setAttribute("id", modeSpanId);
	mainDiv.appendChild(spanElt);
	mainDiv.appendChild(document.createElement("br"));
	var submitId;
	for (var i = 0 ; i < p_actions.length ; i++) {
		submitId = p_divId + "_submit_" + i;
		mainDiv.appendChild(createSubmitItem(submitId));
		addEventListenerAndCaptionActionSubmit(p_entriesManager, spanElt, submitId, p_entry, p_actions[i]);
	} 
	mainDiv.appendChild(document.createElement("br"));
	setMode(spanElt, p_entriesManager, p_entry, p_actions[0]);
}

/**
Adds the event listener of an action submit by linking it to an action for the canvas
*/
function addEventListenerAndCaptionActionSubmit(p_entriesManager, p_textElement, p_idSubmitElement, p_entry, p_value) {
	const submitElement = getSubmitElementSetValue(p_idSubmitElement, p_value);
	submitElement.addEventListener('click', function(event) {
 		setMode(p_textElement, p_entriesManager, p_entry, p_value);
	});
}

// -------------------------
// One canvas interaction menu (ie one set of buttons, and one ...)
// Also does the link between canvas items and global items, which is why... a new item with properties (often called "p_canvasActionsManager") is required !

/**
Builds "main puzzle buttons" (MPBs), that allow to start a "mode" to interact with an already loaded puzzle (so this doesn't include loading puzzle).
One such button makes only one of the div visible (related to the mode : manual solve, auto solve, purification...) and performs additional actions.

p_idMainButtons : id of the MPBs
p_idCaptionSwitchMainDivButtons : name and caption for each MPB that allows to switch between modes.
p_methodsOther : method for when you click an MPB, other than what is done blow (making divs visible/invisible, setting up a ... 	
p_mainDivIDs : ids of the divs. 
p_entriesManagersSet : the set of entries manager to allow to switch between them)
*/
function buildPuzzleMenuButtons(p_idMainButtons, p_captionSwitchMainDivButtons, p_methodsOther, p_mainDivIDs, p_entriesManagersSet) {
	const mainDiv = document.getElementById(p_idMainButtons);
	var submitId;
	for (var i = 0 ; i < p_mainDivIDs.length ; i++) {
		submitId = p_idMainButtons + "_AUTO_submit_" + i;
		mainDiv.appendChild(createSubmitItem(submitId, p_captionSwitchMainDivButtons[i]));
		putActionElementClick(submitId, stuffWhenClickingClosure(p_methodsOther[i], p_mainDivIDs, p_entriesManagersSet, i)); 
	}
	const index = p_entriesManagersSet.activeIndex;
	stuffWhenClickingClosure(p_methodsOther[index], p_mainDivIDs, p_entriesManagersSet, index)();
}

function stuffWhenClickingClosure(p_methodOther, p_mainDivIDs, p_entriesManagersSet, p_index) {
	return function() {
		p_methodOther(event);
		for (var i = 0 ; i < p_mainDivIDs.length ; i++) {
			document.getElementById(p_mainDivIDs[i]).style.display = (i == p_index ? "block" : "none");
		}
		p_entriesManagersSet.switchActionsManager(p_index);
	}
}

// ----------------------
// Geographical reference or not to former limits

/* Building HTML - specificities of adjacency puzzles. Final look : 
Vérification anciennes limites géographiques : <input type="checkbox" id="checkbox_former_limits" value="false"></input> <input type="submit" id="manual_former_limits_check">Vérification manuelle anciennes listes géo.</input>
*/
// Meant to appear near global deductions !
function buildAdjacency(p_idGlobal, p_solver, p_manualAction) {
	const mainDiv = document.getElementById(p_idGlobal);
	mainDiv.append(document.createTextNode("Vérification automatiques anciennes limites géo. : "));
	const checkboxFL = document.createElement("input");
	checkboxFL.setAttribute("type", "checkbox");
	checkboxFL.setAttribute("id", "checkbox_former_limits");
	checkboxFL.setAttribute("value", "false");
	checkboxFL.addEventListener('click', function(event) {
		p_solver.setCheckFormerLimits(checkboxFL.checked);
	});
	mainDiv.appendChild(checkboxFL);
	submitItem = createSubmitItem("manual_former_limits_check", "Vérification manuelle anciennes limites géo.");
	submitItem.addEventListener('click', p_manualAction);
	mainDiv.appendChild(submitItem);
}

function resetCheckboxAdjacency(p_solver) { 
	p_solver.setCheckFormerLimits(document.getElementById("checkbox_former_limits").checked);
}