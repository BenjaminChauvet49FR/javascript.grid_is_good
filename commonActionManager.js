const ENTRY = {
	SPACE:'1',
	WALL_R:'2',
	WALL_D:'3'
}

// These items are used in 'main' but also in 'input' where the value is checked, which is why this file is not named (yet) commonHTMLActionManager.

// Editor things
const MODE_NORMAL = {id:1,html:"Etat case",submitCaption:"Changer case grille"};
const MODE_SELECTION = {id:2,html:"Sélection",submitCaption:"Sélectionner cases"};
const MODE_SELECTION_RECTANGLE = {id:3,html:"Sélection rectangulaire",submitCaption:"Sélectionner cases en rectangle"};
const MODE_ERASE = {id:4,html:"Effaçage",submitCaption:"Effacer murs autour case / effacer case"};
const MODE_SYMBOLS_PROMPT = {id:5, html : "Symboles en chaîne", submitCaption : "Ajouter symboles en chaîne"};
const MODE_MASS_SYMBOL_PROMPT = {id:6, html : "Symbole à ajouter : ", submitCaption : "Ajouter symbole en masse "};
const MODE_NORMAL_WALL = {id:7, html:"Murs", submitCaption : "Changer murs"};

// Positive actions on space
const ACTION_INCLUDE_LOOP_SPACE = {id:1, htmlCaption : "Inclure case dans boucle"};
const ACTION_FILL_SPACE = {id:1, htmlCaption:"Colorier case"};
const ACTION_PUT_STAR = {id:1, htmlCaption:"Placer une étoile"};
const ACTION_OPEN_SPACE = {id:1, htmlCaption:"Déclarer case ouverte"};
const ACTION_OPEN_SPACE_FAKE = {id:1, htmlCaption:"Poser déduction case ouverte"};
const ACTION_ENTER_NUMBER = {id:1, htmlCaption:"Entrer un nombre"};
const ACTION_PUT_BULB = {id:1, htmlCaption:"Placer ampoule"};
const ACTION_PUT_STITCH = {id:1, htmlCaption:"Placer point de couture"};
const ACTION_PUT_ROUND = {id:2, htmlCaption:"Placer un rond"};
const ACTION_PUT_SQUARE = {id:3, htmlCaption:"Placer un carré"};
const ACTION_PUT_TRIANGLE = {id:4, htmlCaption:"Placer un triangle"};
// Negative actions on space
const ACTION_EXCLUDE_LOOP_SPACE = {id:21, htmlCaption : "Ecarter case de boucle"};
const ACTION_PUT_NO_FILL = {id:21, htmlCaption:"Placer un X"};
const ACTION_CLOSE_SPACE = {id:21, htmlCaption:"Déclarer case fermée"};
const ACTION_CLOSE_SPACE_FAKE = {id:21, htmlCaption:"Poser déduction case fermée"};
// Somewhat neutral actions on space
const ACTION_SELECTION_RECTANGLE = {id:41, htmlCaption : "Sélectionner cases en rectangle"};
const ACTION_SELECTION_REGION = {id:42, htmlCaption : "Sélectionner région"};
// Action pass
const ACTION_PASS_REGION = {id:101,htmlCaption:"Passer région"};
const ACTION_PASS_REGION_OR_SPACE = {id:101, htmlCaption : "Passer région ou case"};
const ACTION_PASS_SPACE = {id:101,htmlCaption:"Passer case"};
const ACTION_PASS_GRIDS = {id:101, htmlCaption : "Passer grilles"}; // In sudoku
const ACTION_PASS_ROW = {id:103, htmlCaption:"Passer ligne"};
const ACTION_PASS_COLUMN = {id:104, htmlCaption:"Passer colonne"};
const ACTION_PASS_REGION_AND_ADJACENT_ONES = {id:105, htmlCaption:"Passer région + adjacentes"};
const ACTION_PASS_REGION_AND_ADJACENCY_SPACES = {id:106, htmlCaption:"Passer région + cases adjacentes"};
const ACTION_SMART_PASS_REGION = {id:107, htmlCaption : "Passer région intelligemment"};
const ACTION_PASS_AROUND_SPACE = {id:108, htmlCaption : "Passer aux alentours d'une case"};
const ACTION_PASS_AROUND_NUMERIC_SPACES_OR_SPACE = {id:108, html : "Passer case / ensemble de cases numériques", submitCaption :  "Passer case(s)"};
const ACTION_PASS_AROUND_SPACES = {id:108, htmlCaption:"Passer alentour case indice"};
const ACTION_PASS_STRIP = {id:109, htmlCaption:"Passer bande(s)"};
const ACTION_PASS_STRIP_OR_SPACE = {id:109, htmlCaption : "Passer bande ou case"};
const ACTION_PASS_NUMBERS_SET = {id:101, htmlCaption : "Passer ensemble de cases"};
const ACTION_PASS_GALAXY_DELIMITATION = {id:101, htmlCaption : "Passer autour centre galaxie"};

// Positive actions on walls/fence
const ACTION_LINK_SPACES = {id:51, htmlCaption:"Lier cases"};
const ACTION_OPEN_FENCE = {id:51, htmlCaption:"Déclarer cloison ouverte"};
const ACTION_BIND_STITCHES = {id:51, htmlCaption:"Déclarer liaison entre points"};
// Negative actions on walls/fence
const ACTION_CLOSE_LINKS = {id:52, htmlCaption:"Fermer liaison cases"};
const ACTION_CLOSE_FENCE = {id:52, htmlCaption:"Déclarer cloison fermée"};
const ACTION_NOT_BIND_STITCHES = {id:52, htmlCaption:"Non-liaison entre points"};
// Action pass on walls/fence
const ACTION_PASS_FENCE = {id:53, htmlCaption:"Passer cloison"};
const ACTION_PASS_BORDER = {id:53, htmlCaption:"Passer frontière"};

// Both spaces and walls/fence
const ACTION_NOTHING = {id:0, htmlCaption : "Ne rien faire"};

function getSubmitElementSetValue(p_idSubmitElement, p_value) {
	const submitElement = document.getElementById(p_idSubmitElement);
	submitElement.value = (p_value.submitCaption) ? p_value.submitCaption : p_value.htmlCaption;
	return submitElement;	
}

/* Building HTML. Final look :
<Action case : <span id="text_canvas_action_space"></span></br>
<input type="submit" id="submit_open_space" value="XXX"></input>
<input type="submit" id="submit_close_space" value="XXX"></input>
<input type="submit" id="submit_put_round" value="XXX"></input>
<input type="submit" id="submit_put_square" value="XXX"></input>
<input type="submit" id="submit_pass_space" value="XXX"></input></br>
Action cloison : <span id="text_canvas_action_fence"></span></br>
<input type="submit" id="submit_open_fence" value="XXX"></input>
<input type="submit" id="submit_close_fence" value="XXX"></input>
<input type="submit" id="submit_no_touch_fence" value="XXX"></input></br>*/

// This method also generates an HTML item, in addition to bind action listeners to it
function buildInputCanvas(p_mainDivId, p_actionsManager, p_actionText, p_textActionIdentifier, p_entry, p_actions) {
	
	const mainDiv = document.getElementById(p_mainDivId);
	var ids = [];
	var submitButton;
	mainDiv.appendChild(document.createTextNode("Action " + p_actionText + " : "));
	const spanElt = document.createElement("span");
	spanElt.setAttribute("id", p_textActionIdentifier);
	mainDiv.appendChild(spanElt);
	mainDiv.appendChild(document.createElement("br"));
	for (var i = 0 ; i < p_actions.length ; i++) {
		mainDiv.appendChild(createSubmitItem(p_textActionIdentifier + "_" + i));
		ids.push(p_textActionIdentifier + "_" + i);
	}
	mainDiv.appendChild(document.createElement("br"));
	addEventsListenersAndCaptionsAndSetOne(p_actionsManager, p_textActionIdentifier, ids, p_entry, p_actions);
}


// ------------------------------
// Event & captions

// Adds events liteners to submits to make the texts change.
// Precondition : same length for p_identifiers and p_actions ; entries in same index in both arrays are linked together
// Item 0 considered "more interesting" since it is the first one when puzzle is initiated.
function addEventsListenersAndCaptionsAndSetOne(p_actionsManager, p_textActionIdentifier, p_submitIdentifiers, p_entry, p_actions) {
	const textActionItem = document.getElementById(p_textActionIdentifier);
	for (var i = 0 ; i < p_submitIdentifiers.length ; i++) {			
		addEventListenerAndCaptionActionSubmit(p_actionsManager, textActionItem, p_submitIdentifiers[i], p_entry, p_actions[i]);
	}
	setMode(textActionItem, p_actionsManager, p_entry, p_actions[0]);
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

/**
Changes the mode, both visually (innerHTML) and in model
*/
function setMode(p_textElement, p_entriesManager, p_entry, p_value) {
    p_textElement.innerHTML = p_value.html ? p_value.html : p_value.htmlCaption;
	switch(p_entry) {
		case (ENTRY.SPACE) : p_entriesManager.clickSpace = p_value; break; 
		case (ENTRY.WALL_R) : p_entriesManager.clickWallD = p_value; break; 
		case (ENTRY.WALL_D) : p_entriesManager.clickWallR = p_value; break; 
		case (ENTRY.WALLS) : 
			p_entriesManager.clickWallD = p_value;
			p_entriesManager.clickWallR = p_value;
		break; 
	}
}
