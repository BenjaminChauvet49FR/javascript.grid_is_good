const ENTRY = {
	SPACE:'1',
	WALL_R:'2',
	WALL_D:'3'
}

const MODE_NORMAL = {id:1,html:"Etat case",submitCaption:"Changer case grille"};
const MODE_SELECTION = {id:2,html:"Sélection",submitCaption:"Sélectionner cases"};
const MODE_SELECTION_RECTANGLE = {id:3,html:"Sélection rectangulaire",submitCaption:"Sélectionner cases en rectangle"};
const MODE_ERASE = {id:4,html:"Effaçage",submitCaption:"Effacer murs autour case / effacer case"};
const MODE_SYMBOLS_PROMPT = {id : 101, html : "Symboles en chaîne", submitCaption : "Ajouter symboles en chaîne"};
const MODE_MASS_SYMBOL_PROMPT = {id : 102, html : "Symbole à ajouter : ", submitCaption : "Ajouter symbole en masse "};
const MODE_NORMAL_WALL = {id:103, html:"Murs", submitCaption : "Changer murs"};

const ACTION_PASS_REGION = {id:101,htmlCaption:"Passer région"};
const ACTION_PASS_SPACE = {id:105,htmlCaption:"Passer case"};
const ACTION_PASS_ROW = {id:102,htmlCaption:"Passer ligne"};
const ACTION_PASS_COLUMN = {id:103,htmlCaption:"Passer colonne"};
const ACTION_PASS_REGION_AND_ADJACENCY = {id:104,htmlCaption:"Passer région + adjacentes"};
const ACTION_PASS_REGION_AND_ADJACENCY_SPACES = {id:104,htmlCaption:"Passer région + cases adjacentes"};
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
const ACTION_OPEN_FENCE = {id:12,htmlCaption:"Déclarer cloison ouverte"};
const ACTION_CLOSE_FENCE = {id:13,htmlCaption:"Déclarer cloison fermée"};
const ACTION_ENTER_NUMBER = {id:14,htmlCaption:"Entrer un nombre"};
const ACTION_PUT_ROUND = {id:15, htmlCaption:"Placer un rond"};
const ACTION_PUT_SQUARE = {id:16, htmlCaption:"Placer un carré"};
const ACTION_PASS_STRIP = {id:17, htmlCaption:"Passer bande(s)"};
const ACTION_PUT_BULB = {id:17, htmlCaption:"Placer ampoule"};
const ACTION_PASS_NUMERIC_SPACES = {id:18, htmlCaption:"Passer ensemble de cases numériques"};
const ACTION_PUT_STITCH = {id:19, htmlCaption:"Placer point de couture"};
const ACTION_BIND_STITCHES = {id:20, htmlCaption:"Déclarer liaison entre points"};
const ACTION_NOT_BIND_STITCHES = {id:21, htmlCaption:"Non-liaison entre points"};
const ACTION_PASS_BORDER = {id:22, htmlCaption:"Passer frontière"};
const ACTION_PASS_AROUND_SPACES = {id:23, htmlCaption:"Passer alentour case indice"};
const ACTION_PASS_NUMBERS_SET = {id:24, htmlCaption:"Passer ensemble de cases"};

/**
Getter of setter for a specific mode
*/
function setNumberMode(p_numericMode,p_number){p_numericMode.numberToInput = p_number};
function getNumberMode(p_numericMode){return p_numericMode.numberToInput};

function getSubmitElementSetValue(p_idSubmitElement, p_value) {
	const submitElement = document.getElementById(p_idSubmitElement);
	submitElement.value = (p_value.submitCaption) ? p_value.submitCaption : p_value.htmlCaption;
	return submitElement;	
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