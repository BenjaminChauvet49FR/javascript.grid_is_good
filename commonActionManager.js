const ENTRY = {
	SPACE:'1',
	WALL_R:'2',
	WALL_D:'3'
}

const MODE_NORMAL = {id:1,html:"Etat case",submitCaption:"Changer case grille"};
const MODE_SELECTION = {id:2,html:"Sélection",submitCaption:"Sélectionner cases"};
const MODE_SELECTION_RECTANGLE = {id:3,html:"Sélection rectangulaire",submitCaption:"Sélectionner cases en rectangle"};
const MODE_ERASE = {id:4,html:"Effaçage",submitCaption:"Effacer murs autour case"};
const MODE_NUMBER_SPACE = {id:51,html:"Ajout numéro case",submitCaption:"Case : ajouter le n° ",numberToInput:0};
const MODE_NUMBER_REGION = {id:53,html:"Ajout numéro région",submitCaption:"Région : ajouter le n° ",numberToInput:0};
const MODE_PEARL_ABSTRACT = {id:52};
const MODE_PEARL_WHITE = {id:MODE_PEARL_ABSTRACT.id, html:"Ajout blanc",submitCaption:"Ajouter perle blanche"};
const MODE_PEARL_BLACK = {id:MODE_PEARL_ABSTRACT.id, html:"Ajout noir",submitCaption:"Ajouter perle noire"};
const MODE_ARROW_COMBINED = {id:61, html:"Ajout flèche combinée", submitCaption:"Ajouter flèche combinée"}; // "ARROW COMBINED" parce que la flèche est combinée à un nombre.
const MODE_NORMAL_WALL = {id:102,html:"Murs",submitCaption:"Changer murs"};

const ACTION_PASS_REGION = {id:101,htmlCaption:"Passer région"};
const ACTION_PASS_SPACE = {id:105,htmlCaption:"Passer case"};
const ACTION_PASS_ROW = {id:102,htmlCaption:"Passer ligne"};
const ACTION_PASS_COLUMN = {id:103,htmlCaption:"Passer colonne"};
const ACTION_PASS_REGION_AND_ADJACENCY = {id:104,htmlCaption:"Passer région + adjacentes"};
const ACTION_FILL_SPACE = {id:2,htmlCaption:"Colorier case"};
const ACTION_PUT_NO_FILL = {id:3,htmlCaption:"Placer un X"};
const ACTION_PUT_STAR = {id:4,htmlCaption:"Placer une étoile"};
const ACTION_PUT_NO_STAR = {id:5,htmlCaption:"Placer un X"};
const ACTION_OPEN_SPACE = {id:6,htmlCaption:"Déclarer case ouverte"};
const ACTION_CLOSE_SPACE = {id:7,htmlCaption:"Déclarer case fermée"};
const ACTION_OPEN_SPACE_FAKE = {id:8,htmlCaption:"Poser déduction case ouverte"};
const ACTION_CLOSE_SPACE_FAKE = {id:9,htmlCaption:"Poser déduction case fermée"};
const ACTION_LINK_SPACES = {id:10,htmlCaption:"Lier cases"};
const ACTION_CLOSE_LINKS = {id:11,htmlCaption:"Fermer liaison cases"};

/**
Getter of setter for a specific mode
*/
function setNumberMode(p_numericMode,p_number){p_numericMode.numberToInput = p_number};
function getNumberMode(p_numericMode){return p_numericMode.numberToInput};

/**
Adds the event listener of an action submit by linking it to an action for the canvas
*/
function addEventListenerAndCaptionForSolver(p_entriesManager, p_textElement, p_idSubmitElement, p_entry, p_value) {
    addEventListenerAndCaptionActionSubmit(null, p_entriesManager, p_textElement, p_idSubmitElement, p_entry, p_value);
}

function addEventListenerAndCaptionActionSubmit(p_editorCore, p_entriesManager, p_textElement, p_idSubmitElement, p_entry, p_value) {
    const submitElement = document.getElementById(p_idSubmitElement);
	submitElement.value = (p_value.submitCaption) ? p_value.submitCaption : p_value.htmlCaption; 
	
	// For editor only
	submitElement.addEventListener('click', function(event) {
		if (p_entry == ENTRY.SPACE && p_editorCore != null) {
			applyChangesForSpaceMode(p_editorCore);	
		}
		setMode(p_textElement, p_entriesManager, p_entry, p_value);
	});
}

/**
Changes the mode, both visually (innerHTML) and in model
*/
function setMode(p_textElement, p_entriesManager, p_entry, p_value) {
    p_textElement.innerHTML = p_value.html ? p_value.html : p_value.htmlCaption;
	switch(p_entry){
		case (ENTRY.SPACE):p_entriesManager.clickSpace = p_value;break; 
		case (ENTRY.WALL_R):p_entriesManager.clickWallD = p_value;break; 
		case (ENTRY.WALL_D):p_entriesManager.clickWallR = p_value;break; 
		case (ENTRY.WALLS): 
			p_entriesManager.clickWallD = p_value;
			p_entriesManager.clickWallR = p_value;
		break; 
	}
}