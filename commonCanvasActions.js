const ENTRY = {
	SPACE:'1',
	WALLS:'2',
	CORNER:'3',
	NET_EDGE:'4',
	NET_NODE:'5'
}

// These items are used in 'main' but also in 'input' where the value is checked, which is why this file is not named (yet) commonHTMLActionManager.

// Editor things
const MODE_WALL_SPACE = {id:1, htmlText : "Changer état muré/non muré case", submitCaption : "Etat case"};
const MODE_SELECTION = {id:2, htmlText : "Sélection", submitCaption : "Sélectionner cases"};
const MODE_SELECTION_RECTANGLE = {id:3, htmlText : "Sélection rectangulaire" , submitCaption:"Sélectionner cases en rectangle"};
const MODE_ERASE = {id:4, htmlText : "Effaçage", submitCaption:"Effacer murs autour case / effacer case"};
const MODE_SYMBOLS_PROMPT = {id:5, htmlText : "Symboles en chaîne", submitCaption : "Ajouter symboles en chaîne"};
const MODE_MASS_SYMBOL_PROMPT = {id:6, htmlText : "Symbole à ajouter : ", submitCaption : "Ajouter symbole en masse "};
const MODE_ADD_WILD_CARDS = {id:7, htmlText : "Ajout de wildcards (penser à les sélectionner ensuite)", submitCaption : "Ajouter wildcards"};
const MODE_ADD_ONE_SYMBOL = {id:8, htmlText : "Ajout de symbole", submitCaption : "Ajouter symbole"};

// Positive actions on space
const ACTION_INCLUDE_LOOP_SPACE = {id:1, htmlCaption : "Inclure case dans boucle"};
const ACTION_FILL_SPACE = {id:1, htmlCaption:"Colorier case"};
const ACTION_PUT_STAR = {id:1, htmlCaption:"Placer une étoile"};
const ACTION_OPEN_SPACE = {id:1, htmlCaption:"Déclarer case ouverte"};
const ACTION_OPEN_SPACE_FAKE = {id:1, htmlCaption:"Poser déduction case ouverte"};
const ACTION_ENTER_NUMBER = {id:1, htmlCaption:"Entrer un nombre"};
const ACTION_PUT_BULB = {id:1, htmlCaption:"Placer ampoule"};
const ACTION_PUT_STITCH = {id:1, htmlCaption:"Placer point de couture"};
const ACTION_SEA_SPACE = {id:1, htmlCaption:"Placer une case de mer (case ouverte)"};
const ACTION_PUT_ROUND = {id:2, htmlCaption:"Placer un rond"};
const ACTION_PUT_SQUARE = {id:3, htmlCaption:"Placer un carré"};
const ACTION_PUT_TRIANGLE = {id:4, htmlCaption:"Placer un triangle"};
const ACTION_PUT_BLACK_QUARTER_TRIANGLE = {id:1, htmlCaption:"Quart de case noir"};
// Negative actions on space
const ACTION_EXCLUDE_LOOP_SPACE = {id:21, htmlCaption : "Ecarter case de boucle"};
const ACTION_PUT_NO_FILL = {id:21, htmlCaption:"Placer un X"};
const ACTION_ISLAND_SPACE = {id:21, htmlCaption:"Placer une île (case fermée)"};
const ACTION_CLOSE_SPACE = {id:21, htmlCaption:"Déclarer case fermée"};
const ACTION_CLOSE_SPACE_FAKE = {id:21, htmlCaption:"Poser déduction case fermée"};
const ACTION_PUT_WHITE_QUARTER_TRIANGLE = {id:21, htmlCaption:"Quart de case blanc"};
// Somewhat neutral actions on space
const ACTION_SELECTION_RECTANGLE = {id:41, htmlCaption : "Sélectionner cases en rectangle"};
const ACTION_SELECTION_REGION = {id:42, htmlCaption : "Sélectionner région"};
const ACTION_NEUTRALIZE_SPACE = {id:41, htmlCaption : "Retirer de case"}; // Manual mode only
// Action pass
const ACTION_PASS_REGION = {id:101,htmlCaption:"Passer région"};
const ACTION_PASS_REGION_OR_SPACE = {id:101, htmlCaption : "Passer région ou case"};
const ACTION_PASS_SPACE = {id:101,htmlCaption:"Passer case"};
const ACTION_PASS_GRIDS = {id:101, htmlCaption : "Passer grilles"}; // In Sudoku
const ACTION_PASS_ALL_REGIONS_SIZE = {id:102, htmlCaption : "Passer toutes régions d'une taille donnée"}; // In Putteria
const ACTION_PASS_ROW = {id:103, htmlCaption:"Passer ligne"};
const ACTION_PASS_COLUMN = {id:104, htmlCaption:"Passer colonne"};
const ACTION_PASS_ROW_COLUMN = {id:109, htmlCaption:"Passer ligne & colonne"};
const ACTION_PASS_REGION_AND_ADJACENT_ONES = {id:105, htmlCaption:"Passer région + adjacentes"};
const ACTION_PASS_REGION_AND_ADJACENCY_SPACES = {id:106, htmlCaption:"Passer région + cases adjacentes"};
const ACTION_SMART_PASS_REGION = {id:107, htmlCaption : "Passer région intelligemment"};
const ACTION_PASS_AROUND_SPACE = {id:108, htmlCaption : "Passer aux alentours d'une case"};
const ACTION_PASS_AROUND_NUMERIC_SPACES_OR_SPACE = {id:108, htmlText : "Passer case / ensemble de cases numériques", submitCaption : "Passer case(s)"};
const ACTION_PASS_AROUND_SPACES = {id:108, htmlCaption:"Passer alentour case indice"};
const ACTION_PASS_STRIP = {id:109, htmlCaption:"Passer bande(s)"};
const ACTION_PASS_STRIP_OR_SPACE = {id:109, htmlCaption : "Passer bande ou case"};
const ACTION_PASS_AROUND_KNOT = {id:109, htmlCaption : "Passer autour noeud"};
const ACTION_PASS_NUMBERS_SET = {id:101, htmlCaption : "Passer ensemble de cases"};
const ACTION_PASS_GALAXY_DELIMITATION = {id:101, htmlCaption : "Passer autour centre galaxie"};
const ACTION_PASS_MESH = {id:102, htmlCaption : "Passer autour maille"};

// Positive actions on walls/fence
const ACTION_LINK_SPACES = {id:51, htmlCaption : "Lier cases"};
const ACTION_OPEN_FENCE = {id:51, htmlCaption : "Déclarer cloison ouverte"};
const ACTION_BIND_STITCHES = {id:51, htmlCaption : "Déclarer liaison entre points"};
// Negative actions on walls/fence
const ACTION_CLOSE_LINKS = {id:52, htmlCaption:"Fermer liaison cases"};
const ACTION_CLOSE_FENCE = {id:52, htmlCaption:"Déclarer cloison fermée"};
const ACTION_NOT_BIND_STITCHES = {id:52, htmlCaption:"Non-liaison entre points"};
// Action pass on walls/fence
const ACTION_PASS_FENCE = {id:53, htmlCaption:"Passer cloison"};
const ACTION_PASS_BORDER = {id:53, htmlCaption:"Passer frontière"};

// All kinds of inputs
const ACTION_NOTHING = {id:0, htmlCaption : "Ne rien faire"};

// Purification 
const ACTION_PURIFY_SPACE = {id:10001, htmlCaption:"Purifier case"};
const ACTION_UNPURIFY_SPACE = {id:10002, htmlCaption:"Dépurifier case"};


// ----------------
// Methods that exploit it :

// Gets a submit element and sets its value according to a submitCaption/htmlCaption item.
function getSubmitElementSetValue(p_idSubmitElement, p_value) {
	const submitElement = document.getElementById(p_idSubmitElement);
	submitElement.value = (p_value.submitCaption) ? p_value.submitCaption : p_value.htmlCaption;
	return submitElement;	
}

function setTextElementInnerHTML(p_textElement, p_value) {
	p_textElement.innerHTML = p_value.htmlText ? p_value.htmlText : p_value.htmlCaption;
}

/**
Changes the mode, both visually (innerHTML) and in model
*/
function setMode(p_textElement, p_entriesManager, p_entry, p_value) {
	setTextElementInnerHTML(p_textElement, p_value);
	switch(p_entry) {
		case (ENTRY.SPACE) : p_entriesManager.clickSpace = p_value; break; 
		case (ENTRY.CORNER) : p_entriesManager.clickCorner = p_value; break; 
		case (ENTRY.WALLS) : 
			p_entriesManager.clickWallD = p_value;
			p_entriesManager.clickWallR = p_value;
		break;
		case (ENTRY.NET_NODE) : p_entriesManager.clickDot = p_value; break;
		case (ENTRY.NET_EDGE) : 
			p_entriesManager.clickEdgeD = p_value; 
			p_entriesManager.clickEdgeR = p_value; 
		break;
	}
}

// Generates a "clean" entry manager
function generateEntryManager() {
	return {
		clickSpace : ACTION_NOTHING,
		clickWallD : ACTION_NOTHING,
		clickWallR : ACTION_NOTHING,
		clickDot : ACTION_NOTHING,
		clickCorner : ACTION_NOTHING,
		clickEdgeD : ACTION_NOTHING,
		clickEdgeR : ACTION_NOTHING
	}
}