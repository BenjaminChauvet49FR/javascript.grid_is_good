/* Building HTML - Actions global. Final look :
Actions globales : </br>
<input type="submit" id="submit_multiPass" value="Multipasse"></input></br>
<input type="submit" id="submit_undo" value="Annuler"></input></br>	
<span id="span_resolution_state"></span></br>	

p_idGlobalActions is in HTML
p_listIDs and p_listActions must have the same length
*/
function buildActionsGlobal(p_idGlobalActions, p_idText, p_listCaptions, p_listFunctions) {
	const mainDiv = document.getElementById(p_idGlobalActions);
	mainDiv.append(document.createTextNode("Actions globales"));
	mainDiv.append(document.createElement("br"));
	var id;
	for (var i = 0 ; i < p_listCaptions.length ; i++) {
		id = p_idText + "_" + i
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

function buildQuickStart(p_idGlobal, p_quickStartMethod) {
	const mainDiv = document.getElementById(p_idGlobal);
	mainDiv.appendChild(createSubmitItem("submit_quickStart", "Démarrage rapide"));
	putActionElementClick("submit_quickStart", p_quickStartMethod);
}

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
	checkboxFL.addEventListener('click', function(event){
		p_solver.setCheckFormerLimits(checkboxFL.checked);
	});
	mainDiv.appendChild(checkboxFL);
	submitItem = createSubmitItem("manual_former_limits_check", "Vérification manuelle anciennes limites géo.");
	submitItem.addEventListener('click', p_manualAction);
	mainDiv.appendChild(submitItem);
}

function resetCheckboxAdjacency() {
	document.getElementById("checkbox_former_limits").checked = false;
}