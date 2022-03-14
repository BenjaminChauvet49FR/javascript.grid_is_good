const EMPTINESS_CHARACTER = "E";
// See "inputOptions" in inputComboChange.js

// Note : what's gonna happen when we have other models of regions ? (Sudoku Killer)
// Also, Admit that that combobox is for "normal sudoku"

// Clicks on the canvas 
function clickCanvasAction(event, p_canvas, p_drawer, p_editorCore, p_modes) {
    var doneClicking = false;
	const p_xLength = p_editorCore.getXLength();
	const p_yLength = p_editorCore.getYLength();
	if (p_editorCore.isGalaxy()) {
		clickCanvasActionGalaxy(event, p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength);
		doneClicking = true;
	} else if (p_editorCore.relevantCorners()) {
		doneClicking = clickCornerAction(event, p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength);
	} else if (p_editorCore.holdsLinks()) {
		var indexWallR = p_drawer.getClickEdgeR(event, p_canvas, p_xLength, p_yLength);
		var indexWallD = p_drawer.getClickEdgeD(event, p_canvas, p_xLength, p_yLength);
		if (indexWallR != null) {
			p_editorCore.switchWallR(indexWallR.x, indexWallR.y);
			doneClicking = true;
		}
		if (indexWallD != null) {
			p_editorCore.switchWallD(indexWallD.x, indexWallD.y);
			doneClicking = true;
		}
	} else if (p_editorCore.hasWalls() && !inputOptions.lockedWalls) {
		var indexWallR = p_drawer.getClickWallR(event, p_canvas, p_xLength, p_yLength);
		var indexWallD = p_drawer.getClickWallD(event, p_canvas, p_xLength, p_yLength);
		if (indexWallR != null) {
			p_editorCore.switchWallR(indexWallR.x, indexWallR.y);
			doneClicking = true;
		}
		if (indexWallD != null) {
			p_editorCore.switchWallD(indexWallD.x, indexWallD.y);
			doneClicking = true;
		}
	} 
    if (doneClicking) {
        return;
    }
    var indexSpaces = p_drawer.getClickSpace(event, p_canvas, p_xLength, p_yLength);
    if (indexSpaces != null) {
        clickSpaceAction(p_editorCore, indexSpaces.x, indexSpaces.y, p_modes);
    }
	var indexMargin = p_drawer.getClickMargin(event, p_canvas, p_xLength, p_yLength, p_editorCore.getMarginLeftLength(), p_editorCore.getMarginUpLength(), p_editorCore.getMarginRightLength(), p_editorCore.getMarginRightLength());
	if (indexMargin != null) {
		clickMarginAction(p_editorCore, indexMargin.edge, indexMargin.index);
	}
}

// According to the "visible grid", returns elements for prompt 
getPromptElementsFromVisibleGrid = function(p_editorCore) {
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_SPACE)) {
		const validityTokenMethod = (inputOptions.maxNumber != null || inputOptions.minNumber != null || inputOptions.nonNumericStrings == []) ? 
		validityNumberRangeOrSymbolClosure(inputOptions.minNumber, inputOptions.maxNumber, inputOptions.nonNumericStrings) : validityTokenNumber;
		return {
			descriptionPrompt : "Entrer valeurs numériques " + stringRange(inputOptions.minNumber, inputOptions.maxNumber),
			descriptionPromptMono : "Entrer valeur numérique " + stringRange(inputOptions.minNumber, inputOptions.maxNumber),
			defaultToken : "1",
			gridId : GRID_ID.NUMBER_SPACE,
			validityTokenMethod : validityTokenMethod,
			parameters : {emptySpaceChar : inputOptions.forceMonoCharacter ? " " : EMPTINESS_CHARACTER, isMonoChar : inputOptions.forceMonoCharacter, isNumeric : true}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.DIGIT_X_SPACE)) {
		return {
			descriptionPrompt : "Entrer des chiffres entre " + inputOptions.minNumber + " et " + inputOptions.maxNumber + " ou X",
			descriptionPromptMono : "Entrer un chiffre entre " + inputOptions.minNumber + " et " + inputOptions.maxNumber + " ou X",
			defaultToken : "1",
			gridId : GRID_ID.DIGIT_X_SPACE,
			validityTokenMethod : validityNumberRangeOrSymbolClosure(0, inputOptions.maxNumber, ["X"]),
			parameters : {emptySpaceChar : " ", isMonoChar : true, isNumeric : false}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.DIGIT_QUESTION_SPACE)) {
		return {
			descriptionPrompt : "Entrer des chiffres entre " + inputOptions.minNumber + " et " + inputOptions.maxNumber + " ou ?",
			descriptionPromptMono : "Entrer un chiffre entre " + inputOptions.minNumber + " et " + inputOptions.maxNumber + " ou ?",
			defaultToken : "1",
			gridId : GRID_ID.DIGIT_QUESTION_SPACE,
			validityTokenMethod : validityNumberRangeOrSymbolClosure(0, inputOptions.maxNumber, ["?"]),
			parameters : {emptySpaceChar : " ", isMonoChar : true, isNumeric : false}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_X_SPACE)) {
		return {
			descriptionPrompt : "Entrer valeurs numériques " + stringRange(inputOptions.minNumber, inputOptions.maxNumber) + " ou X",
			descriptionPromptMono : "Entrer valeur numérique " + stringRange(inputOptions.minNumber, inputOptions.maxNumber) + " ou X",
			defaultToken : "1",
			gridId : GRID_ID.NUMBER_X_SPACE,
			validityTokenMethod : validityNumberRangeOrSymbolClosure(inputOptions.minNumber, inputOptions.maxNumber, ["X"]),
			parameters : {emptySpaceChar : EMPTINESS_CHARACTER, isMonoChar : false, isNumeric : false}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_REGION)) {
		return {			
			descriptionPrompt : "Entrer valeurs numériques >= 0",
			descriptionPromptMono : "Entrer valeur numérique >= 0",
			defaultToken : "1",
			gridId : GRID_ID.NUMBER_REGION,
			validityTokenMethod : validityTokenNumber,
			parameters : {emptySpaceChar : EMPTINESS_CHARACTER, isMonoChar : false, isNumeric : true}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.PEARL)) {
		return {
			descriptionPrompt : "Entrer suite de perles (B|W)",
			descriptionPromptMono : "Entrer lettre de perle (B|W)",
			defaultToken : "W",
			gridId : GRID_ID.PEARL,
			validityTokenMethod : validityTokenCharacterSelectionClosure(['B', 'W']),
			parameters : {emptySpaceChar : " ", isMonoChar : true}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.OX)) {
		return {
			descriptionPrompt : "Entrer suite de X ou O (X|O)",
			descriptionPromptMono : "Entrer X ou O (X|O)",
			defaultToken : "X",
			gridId : GRID_ID.OX,
			validityTokenMethod : validityTokenCharacterSelectionClosure(['O', 'X']),
			parameters : {emptySpaceChar : " ", isMonoChar : true}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.PLAYSTATION_SHAPES)) {
		return {
			descriptionPrompt : "Entrer suite de formes (R|S|T)",
			descriptionPromptMono : "Entrer lettre de forme (R|S|T)",
			defaultToken : "R",
			gridId : GRID_ID.PLAYSTATION_SHAPES,
			validityTokenMethod : validityTokenCharacterSelectionClosure(['R', 'S', 'T']),
			parameters : {emptySpaceChar : " ", isMonoChar : true}
		}
	} else if (p_editorCore.isVisibleGrid(GRID_ID.YAJILIN_LIKE)) {
		return {
			descriptionPrompt : "Entrer suite d'indices à la Yajilin (L|U|R|D)(nombre) ou X",
			descriptionPromptMono : "Entrer indice à la Yajilin (L|U|R|D)(nombre) ou X",
			defaultToken : "L1",
			gridId : GRID_ID.YAJILIN_LIKE,
			validityTokenMethod : validityTokenYajilin,
			parameters : {emptySpaceChar : EMPTINESS_CHARACTER, isMonoChar : false}
		}		
	} else if (p_editorCore.isVisibleGrid(GRID_ID.YAJILIN_BLACK_WHITE)) {
		return {
			descriptionPrompt : "Entrer suite d'indices à la Yajilin précédé de noir/blanc (B|W)(L|U|R|D)(nombre) ou (B|W)",
			descriptionPromptMono : "Entrer indice à la Yajilin précédé de noir/blanc (B|W)(L|U|R|D)(nombre) ou (B|W)",
			defaultToken : "WL1",
			gridId : GRID_ID.YAJILIN_BLACK_WHITE,
			validityTokenMethod : validityTokenYajilinBorW,
			parameters : {emptySpaceChar : EMPTINESS_CHARACTER, isMonoChar : false}
		}		
	} else if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_BLACK_WHITE)) {
		return {
			descriptionPrompt : "Entrer suite de (B|W)(nombre)",
			descriptionPromptMono : "Entrer (B|W)(nombre)",
			defaultToken : "W2",
			gridId : GRID_ID.NUMBER_BLACK_WHITE,
			validityTokenMethod : validityTokenNumbersBorW,
			parameters : {emptySpaceChar : EMPTINESS_CHARACTER, isMonoChar : false}
		}		
	} else if (p_editorCore.isVisibleGrid(GRID_ID.TAPA)) {
		return {
			descriptionPrompt : "Entrer suite de combinaisons de chiffres (au plus quatre chiffres) ou '?' pouvant correspondre à un indice valide de Tapa",
			descriptionPromptMono : "Entrer combinaison de chiffres (au plus quatre chiffres) ou '?' pouvant correspondre à un indice valide de Tapa",
			defaultToken : "21?",
			gridId : GRID_ID.TAPA,
			validityTokenMethod : validityTokenTapa,
			parameters : {emptySpaceChar : EMPTINESS_CHARACTER, isMonoChar : false}
		}		
	} else if (p_editorCore.isVisibleGrid(GRID_ID.MOONSUN)) {
		return {
			descriptionPrompt : "Entrer suite d'astres (S|M)",
			descriptionPromptMono : "Entrer astre (S|M)",
			defaultToken : "S",
			gridId : GRID_ID.MOONSUN,
			validityTokenMethod : validityTokenCharacterSelectionClosure(['M', 'S']),
			parameters : {emptySpaceChar : " ", isMonoChar : true}
		}		
	} else if (p_editorCore.isVisibleGrid(GRID_ID.YAGIT)) {
		return {
			descriptionPrompt : "Entrer suite de formes Yagit (R|S)",
			descriptionPromptMono : "Entrer forme Yagit (R|S)",
			defaultToken : "S",
			gridId : GRID_ID.YAGIT,
			validityTokenMethod : validityTokenCharacterSelectionClosure(['R', 'S']),
			parameters : {emptySpaceChar : " ", isMonoChar : true}
		}		
	}
}


clickSpaceAction = function (p_editorCore, p_x, p_y, p_modes) {
    mode = p_modes.clickSpace;
	var promptElements;
	switch (mode.id) {
		case (MODE_SELECTION.id) :
		    p_editorCore.switchSelectedSpace(p_x, p_y);
		break;
		case (MODE_ERASE.id) :
		    p_editorCore.clearWallsAround(p_x, p_y);
			p_editorCore.clearSpaceContents(p_x, p_y);
		break;
		case (MODE_SELECTION_RECTANGLE.id) :
		    p_editorCore.selectRectangleMechanism(p_x, p_y);
		break;
		case (MODE_ADD_WILDCARDS.id) : 
			promptElements = getPromptElementsFromVisibleGrid(p_editorCore);
			p_editorCore.switchWildcardWithGrid(promptElements.gridId, p_x, p_y);
		break;
		case (MODE_ADD_ONE_SYMBOL.id) : 
			p_editorCore.switchValue(inputOptions.monoSymbolGridId, p_x, p_y, inputOptions.monoSymbolToEnter); // Remember : see "input options" in inputComboChange
		break;
		case (MODE_SYMBOLS_PROMPT.id) :
			promptElements = getPromptElementsFromVisibleGrid(p_editorCore);
			var defaultVal = p_editorCore.getPromptValue();
			if ((!defaultVal && (defaultVal != "0")) || (defaultVal == null) || (defaultVal == "")) {
				defaultVal = promptElements.defaultToken;
			}
			p_editorCore.updateSelectionData();
			var optionalTargetString = "";
			var getWildcards = false;
			if (p_editorCore.hasWildcardsSelected()) {
				optionalTargetString = "(Cible : les wildcards à partir de la case sélectionnée) ";
				getWildcards = true;
			} else if (p_editorCore.getNumberSelectedSpaces()) {
				optionalTargetString = "(Cible : les cases sélectionnées) ";
			}
			// Chains for 
			var optionalRemindString = (!promptElements.parameters.isMonoChar && promptElements.parameters.emptySpaceChar != ' ') ? "(Penser à séparer les indices des caractères " + promptElements.parameters.emptySpaceChar + " par des espaces) " : "";
			const optionsString = "Caractères supplémentaires ("+CHARACTER_MODE_CHARACTER + SAVE_ONE_MODE_CHARACTER +") : cf. mode d'emploi pour liste et utilisation"
			var clueChain = prompt(promptElements.descriptionPrompt + " ou '" + promptElements.parameters.emptySpaceChar + "' pour case vide " + optionalRemindString + optionalTargetString + ":\n" + optionsString, defaultVal );
			if (clueChain != null) {				
				p_editorCore.insertChainGrid(promptElements.gridId, clueChain, promptElements.validityTokenMethod, promptElements.parameters, p_x, p_y, getWildcards);
			}
		break;
		case (MODE_MASS_SYMBOL_PROMPT.id) :
			const visibleGridId = getPromptElementsFromVisibleGrid(p_editorCore).gridId;
			if (p_editorCore.getInputSymbol() == p_editorCore.get(visibleGridId, p_x, p_y)) {
				p_editorCore.set(visibleGridId, p_x, p_y, null);
			} else {
				p_editorCore.set(visibleGridId, p_x, p_y, p_editorCore.getInputSymbol());
			}
		break;
		default :
			if (!inputOptions.lockedWalls) {				
				p_editorCore.switchState(p_x, p_y);
			}
	}
}

clickPopUpHelpPromptAction = function() {
	alert("Mode d'emploi de l'ajout de symboles en prompt : \n"+
	"Possibilité de sélectionner des cases avant. La chaîne doit se présenter ainsi : (options)(SYMBOLES) \n"+
	"Entrer les symboles les uns à la suite des autres. Peut être mono-caractère ou non.\n" +" Exemple dans Shingoki : 'B7 W4 "+EMPTINESS_CHARACTER+EMPTINESS_CHARACTER+EMPTINESS_CHARACTER+" B3'\n"+
	"Où iront les symboles ?\n"+
	"S'il n'y a pas de sélection : à la suite en partant de la case, de gauche à droite\n"+
	"Avec cases sélectionnées : Cette fois, les cibles seront les cases sélectionnées (si aucune wildcard) ou bien les cases sélectionnées avec wildcard (si au moins une case a une wildcard).\n"+
	CHARACTER_MODE_CHARACTER + " : tous les caractères sont lus individuellement et les espaces jouent le vide \n" +
	SAVE_ONE_MODE_CHARACTER + " : le 1er caractère des cases, s'il existe, est préservé \n" +
	"Exemple toujours avec Shingoki : 1) certaines cases peuvent être blanches ou noires après une lecture. 2) Faire 'sélectionner toutes cases', 3) puis 'déselectionner cases vides'. 4) La chaîne suivante est valide : cs3524212 pour mettre un 3 dans la 1ère case sélectionnée, puis un 5 dans dans la suivante et ainsi de suite, en préservant les couleurs.");
}

// Note : obviously copied on above. Will be evolved when margin is evolved.
clickMarginAction = function(p_editorCore, p_edge, p_index) {
	if (p_editorCore.getMarginInfoId() == MARGIN_KIND.NUMBERS_LEFT_UP.id) {
		const promptElements = {
			descriptionPrompt : "Entrer valeurs numériques >= 0",
			descriptionPromptMono : "Entrer valeur numérique >= 0",
			defaultToken : "1",
			validityTokenMethod : validityTokenNumber,
			parameters : {emptySpaceChar : EMPTINESS_CHARACTER, isMonoChar : false, isNumeric : true}
		}
		const optionalRemindString = (!promptElements.parameters.isMonoChar) ? "(Penser à séparer les indices des caractères " + promptElements.parameters.emptySpaceChar + " par des espaces) " : "";
		var valuesChain = prompt(promptElements.descriptionPrompt + " ou " + promptElements.parameters.emptySpaceChar + " pour case vide " + optionalRemindString + ":", promptElements.defaultToken);
		p_editorCore.insertChainMargin(p_edge, valuesChain, promptElements.validityTokenMethod, promptElements.parameters, p_index);
	}
}

// ----------------------

// Prompt action (called from outside)
function setSymbolAndTextAction(p_editorCore, p_textElement, p_modesManager) {
	promptElements = getPromptElementsFromVisibleGrid(p_editorCore);
	if (promptElements) {
		var val = prompt(promptElements.descriptionPromptMono);
		if (promptElements.validityTokenMethod(val)) {
			val = (promptElements.parameters.isNumeric && val != null) ? parseInt(val, 10) : val;
			applyChangesForSpaceMode(p_editorCore, MODE_MASS_SYMBOL_PROMPT);	
			setMode(p_textElement, p_modesManager, ENTRY.SPACE, MODE_MASS_SYMBOL_PROMPT);
			p_textElement.innerHTML += val;
			p_editorCore.setInputSymbol(val);
		}
	}
}

// When the "space mode" is changed (put a number / some symbol, change state...)
function applyChangesForSpaceMode(p_editorCore, p_mode) {
	/*if ((p_mode.id != MODE_SELECTION.id) && (p_mode.id != MODE_SELECTION_RECTANGLE.id)) {
		actionUnselectAll(p_editorCore);
	}*/ // Now, we use wild cards that make selection always good
}

function actionUndoSymbolsPrompt(p_editorCore) {
	if (!p_editorCore.undoLastChainGridInsert()) {
		alert("Derniers changements inexistants ou irréversibles.");
	}
}

//------------------------
// Validity tokens

validityTokenNumber = function(p_clue) {
	return (!isNaN(p_clue));
}

validityNumberRangeOrSymbolClosure = function(p_min, p_max, p_symbol) {
	return function(p_clue) {
		if (!isNaN(p_clue)) {
			const number = parseInt(p_clue, 10);//p_clue == "X" || 
			return ((p_min == null) || (p_min <= number)) && ((p_max == null) || (p_max >= number));
		} else {
			for (var i = 0; i < p_symbol.length ; i++) {
				if (p_clue == p_symbol[i]) {
					return true;
				}
			}
			return false;
		}
	}
}

validityTokenCharacterSelectionClosure = function(p_array) {
	return function(p_clue) {
		for (var i = 0 ; i < p_array.length ; i++) {
			if (p_array[i] == p_clue) {
				return true;
			}
		}
		return false;
	}
}

validityTokenYajilin = function(p_clue) {
	const charClue = p_clue.charAt(0);
	if (charClue == 'X') {
		return true;
	}
	if (charClue == CHAR_DIRECTION.LEFT || charClue == CHAR_DIRECTION.UP || charClue == CHAR_DIRECTION.RIGHT || charClue == CHAR_DIRECTION.DOWN) {
		return ((p_clue.length > 1) && !isNaN(p_clue.substring(1)));
	}
	return false;
}

validityTokenYajilinBorW = function(p_clue) {
	var charClue = p_clue.charAt(0);
	if (!(charClue == 'B' || charClue == 'W')) {
		return false;
	}
	if (p_clue.length == 1) {
		return true;
	}
	charClue = p_clue.charAt(1);
	if (charClue == CHAR_DIRECTION.LEFT || charClue == CHAR_DIRECTION.UP || charClue == CHAR_DIRECTION.RIGHT || charClue == CHAR_DIRECTION.DOWN) {
		return ((p_clue.length > 2) && !isNaN(p_clue.substring(2)));
	}
	return false;
}

validityTokenNumbersBorW = function(p_clue) {
	var charClue = p_clue.charAt(0);
	if (!(charClue == 'B' || charClue == 'W')) {
		return false;
	}
	return p_clue.substring(1);
}

validityTokenTapa = function(p_clue) {
	// Check if clue contains valid characters
	var c;
	var arrayChars = [];
	for (var i = 0 ; i < p_clue.length ; i++) {
		c = p_clue.charAt(i);
		if (c != '?' && (c < '0' || c > '8')) {
			return false;
		} 
	}
	var clue = sortedTapaClueString(p_clue);
	return (indexTapaCombination(clue) != TAPA_INDEX_NOT_FOUND);
}

//------------------------
// Strings for prompt

/**
p_min and p_max must be either numbers or null
*/
function stringRange(p_min, p_max) {
	var answer = "";
	var optionalSpace = "";
	if (p_min != null) {
		answer = ">= " + p_min;
		optionalSpace = " et ";
	}
	if (p_max != null) {
		answer += optionalSpace + "<= " + p_max;
	}
	return answer;
}

//------------------------
// Things to be done when puzzle is restarted

/**
Restarts the grid and the canvas to new dimensions
p_canvas : the canvas to adapt
p_pix : the Pix item
p_editorCore : the Global item
p_xLength : horizontal dimension
p_yLength : vertical dimension
 */
restartAction = function (p_canvas, p_drawer, p_editorCore, p_fieldsDefiningPuzzle, p_ask) {
    if (!p_ask || confirm("Redémarrer la grille ?")) {
		var xLength, yLength;
		if (correspondsToSudokuPuzzle(p_fieldsDefiningPuzzle)) {
			const sudokuMode = getSudokuIdFromLabel(p_fieldsDefiningPuzzle.fieldSudoku.value);
			xLength = sudokuMode.xTotalLength;
			yLength = sudokuMode.yTotalLength;
		} else {
			xLength = parseInt(getFieldX(p_fieldsDefiningPuzzle).value, 10);
			yLength = parseInt(getFieldY(p_fieldsDefiningPuzzle).value, 10);
		}
		if (inputOptions.lockedWalls) {
			const storedWallArray = p_editorCore.getWallArray();
			p_editorCore.setupFromWallArray(storedWallArray);
		} else {			
			p_editorCore.restartGrid(xLength, yLength);
		}
		Object.keys(GRID_ID).forEach(id => {
			editorCore.addCleanGrid(id, xLength, yLength); //  See GRID_ID in EditorCore
		});
        adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);
    }
}

function handleFileSelectAction(p_files, p_canvas, p_drawer, p_editorCore, p_fieldsDefiningPuzzle) {

	for (var i = 0, f; f = p_files[i]; i++) {
		var reader = new FileReader()
		reader.onload = (function(theFile) {
			return function(e) {
				if (analyzerModes.length == 0) {
					alert("Désolé... on ne prend pas en charge ce type de puzzle pour l'instant !");
					return;
				} else {
					restartAction(p_canvas, p_drawer, p_editorCore, p_fieldsDefiningPuzzle, false);
					analyzerMode = analyzerModes[fieldsDefiningPuzzle.selectPictureModel.selectedIndex];
					getInfo(e.target.result, p_drawer, p_editorCore, p_canvas, analyzerMode);
				}
			}
		})(f);
		reader.readAsDataURL(f);
	}
}

//------------------------
// Transformation actions

function rotateCWAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.ROTATE_CW);
}

function rotateUTurnAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.ROTATE_UTURN);
}

function rotateCCWAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.ROTATE_CCW);
}

function mirrorHorizontalAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.MIRROR_HORIZONTAL);
}

function mirrorVerticalAction(p_canvas, p_drawer, p_editorCore) {
	transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.MIRROR_VERTICAL);
}

// Note : this method is not called by resizing
// Also note : no warning yet, but it doesn't affect nodes at all. 
function transformGrid(p_canvas, p_drawer, p_editorCore, p_transformation) {
	if (p_editorCore.isGalaxy()) {
		alert("Transformations impossibles pour le puzzle 'Galaxy'.");
		return;
	}
	var confirmation, xMin, xMax, yMin, yMax;
	p_editorCore.updateSelectionData();
	if (p_editorCore.getNumberSelectedSpaces() != 0) {
		xMin = p_editorCore.getXMinSelected();
		xMax = p_editorCore.getXMaxSelected();
		yMin = p_editorCore.getYMinSelected();
		yMax = p_editorCore.getYMaxSelected();
		if (((xMin + xMax + yMin + yMax) % 2 == 1) && ((p_transformation == GRID_TRANSFORMATION.ROTATE_CW) || (p_transformation == GRID_TRANSFORMATION.ROTATE_CCW))) {			
			alert("Rotation de sélection d'un quart de tour impossible : le pseudo-milieu est sur une arête. Changer les cases sélectionnées (ou annuler la sélection pour affecter toute la grille).");
			confirmation = false;
		} else {
			confirmation = confirm("Les cases sélectionnées seront " + sentenceTransform(p_transformation, xMin, yMin, xMax, yMax) + " ; écrasement potentiel de valeurs. Ne sélectionner aucune case pour affecter toute la grille. Continuer ?");
		}
	} else {
		confirmation = true;
	}
	if (confirmation) {		
		p_editorCore.transformGrid(p_transformation);
	}
    adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);
}

function sentenceTransform(p_transformation, p_xMin, p_yMin, p_xMax, p_yMax) {
	switch (p_transformation) {
		case GRID_TRANSFORMATION.ROTATE_CW : return "pivotées dans le sens horaire par rapport au 'milieu' " + sepc(p_xMin, p_yMin, p_xMax, p_yMax) + " de la sélection"; break;
		case GRID_TRANSFORMATION.ROTATE_UTURN : return "pivotées d'un demi-tour par rapport au 'milieu' " + sepc(p_xMin, p_yMin, p_xMax, p_yMax) + " de la sélection"; break;
		case GRID_TRANSFORMATION.ROTATE_CCW : return "pivotées dans le sens anti-horaire par rapport au 'milieu' " + sepc(p_xMin, p_yMin, p_xMax, p_yMax) + " de la sélection"; break;
		case GRID_TRANSFORMATION.MIRROR_HORIZONTAL : return "réfléchies horizontalement par rapport à l'axe du 'milieu vertical' " + sepm(p_xMin, p_xMax) + " de la sélection"; break;
		case GRID_TRANSFORMATION.MIRROR_VERTICAL : return "réfléchies verticalement par rapport à l'axe du 'milieu horizontal' " + sepm(p_yMin, p_yMax) + " de la sélection"; break;
	}
}

// String expressing pseudo-middle and pseudo-center
function sepm(p_iMin, p_iMax) {
	return "(" + p_iMin + "+" + p_iMax + ")/2";
}

function sepc(p_xMin, p_yMin, p_xMax, p_yMax) {
	return sepm(p_xMin, p_xMax) + "," + sepm(p_yMin, p_yMax);
}

function resizeAction(p_canvas, p_drawer, p_editorCore, p_fieldsDefiningPuzzle) {
	if (confirm("Redimensionner la grille ?")) {
		const xNewLength = parseInt(getFieldX(p_fieldsDefiningPuzzle).value, 10);
		const yNewLength = parseInt(getFieldY(p_fieldsDefiningPuzzle).value, 10);
		p_editorCore.updateSelectionData();
		p_editorCore.transformGrid(GRID_TRANSFORMATION.RESIZE, xNewLength, yNewLength);
		adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);	
	}
}

// -----------------------
// Misc functions for puzzle specificities

getFieldX = function(p_fieldsDefiningPuzzle) { 
	if (p_fieldsDefiningPuzzle.spanXYBound.style.display == "none") {
		return p_fieldsDefiningPuzzle.fieldX;
	} else {
		return p_fieldsDefiningPuzzle.fieldXY;
	}
}

getFieldY = function(p_fieldsDefiningPuzzle) {
	if (p_fieldsDefiningPuzzle.spanXYBound.style.display == "none") {
		return p_fieldsDefiningPuzzle.fieldY;
	} else {
		return p_fieldsDefiningPuzzle.fieldXY;
	}
}

function correspondsToSudokuPuzzle(p_fieldsDefiningPuzzle) {
	return (p_fieldsDefiningPuzzle.spanSelectSudoku.style.display != "none");
}

//------------------------
// Selections actions

function actionSelectAll(p_editorCore) {
	p_editorCore.selectAll();
}

function actionUnselectAll(p_editorCore) {
	p_editorCore.unselectAll();
}

function actionUnselectNull(p_editorCore) {
	p_editorCore.unselectNull();
}

function actionBuildWallsAroundSelection(p_editorCore) {
	p_editorCore.buildWallsAroundSelection();
}

function actionClearContentsSelection(p_editorCore) {
	p_editorCore.clearContentsSelection();
}

function actionMoveSelection(p_editorCore, p_xValue, p_yValue, p_transparencyNull) {
	actionMoveCopySelection(p_editorCore, p_xValue, p_yValue, true, p_transparencyNull, "Déplacer", " ainsi");
}

function actionCopySelection(p_editorCore, p_xValue, p_yValue, p_transparencyNull) {
	actionMoveCopySelection(p_editorCore, p_xValue, p_yValue, false, p_transparencyNull, "Copier", "vers la destination");
}

// Same note as for transforms : no warning yet, but it doesn't affect nodes at all
function actionMoveCopySelection(p_editorCore, p_xValue, p_yValue, p_mode, p_transparencyNull, p_verb, p_part2) {
	const number = p_editorCore.countSpacesSelection();
	if (number > 0 && (p_xValue != 0 || p_yValue != 0)) {
		const confirmString1 = p_verb + " " + number + " case"+ (number > 1 ? "s" : "") + p_part2 + " ?";
		const confirmString2 = (p_xValue != 0) ? ("\n -> " + Math.abs(p_xValue)+" vers la " + (p_xValue > 0 ? "droite" : "gauche")) : "";
		const confirmString3 = (p_yValue != 0) ? ("\n -> " + Math.abs(p_yValue)+" vers le " + (p_yValue > 0 ? "bas" : "haut")) : "";
		if (confirm(confirmString1 + confirmString2 + confirmString3)) {
			p_editorCore.moveCopySelection(p_xValue, p_yValue, p_mode, p_transparencyNull);
		}
	} else {
		alert("Aucune case sélectionnée ou aucun déplacement.");
	}
}

//------------------------
// Remove/rename existing puzzles

// But first a useful function
function alertMissingPuzzle(p_localStorageName) {
	alert("Le stockage local n'a pas de propriété nommée '" + p_localStorageName + "'.");
}

removeAction = function (p_puzzleName, p_detachedName) {
	var localStorageName = getLocalStorageName(p_puzzleName, p_detachedName);
    if (localStorage.hasOwnProperty(localStorageName)) {
        if (confirm("Supprimer la propriété '" + localStorageName + "' du stockage local ?")) {
            localStorage.removeItem(localStorageName);
        }
    } else {
		alertMissingPuzzle(localStorageName);
	}
}

renameAction = function (p_puzzleName, p_fieldValue) { 
	var localStorageName = getLocalStorageName(p_puzzleName, p_fieldValue.value);
    if (localStorage.hasOwnProperty(localStorageName)) {
        const newDetachedName = prompt("Renommer la propriété " + localStorageName + " (le nouveau nom sera automatiquement précédé de 'grid_is_good_" + p_puzzleName + "') : ", p_fieldValue.value);
		if (newDetachedName != null) {
			const localStorageName2 = getLocalStorageName(p_puzzleName, newDetachedName);
			if (localStorageName2 == "" || localStorage.hasOwnProperty(localStorageName2)) {
				alert("Nom "+localStorageName2+" invalide ou déjà pris.");
			} else {
				localStorage.setItem(localStorageName2, localStorage.getItem(localStorageName));
				localStorage.removeItem(localStorageName);
				p_fieldValue.value = newDetachedName;
			}
		}
    } else {
		alertMissingPuzzle(localStorageName);
	}
}

//------------------------
// Saving and loading

/** 
Saves a walled grid into local storage
p_editorCore : the Global item
p_detachedName : the detached name (without the prefix) to store into local storage
 */
saveAction = function (p_editorCore, p_puzzleName, p_detachedName, p_saveLoadMode, p_externalOptions) {
    var localStorageName = getLocalStorageName(p_puzzleName, p_detachedName);
    var letsSave = true;
	if (correspondsToSquarePuzzle(p_saveLoadMode) && p_editorCore.getXLength() != p_editorCore.getYLength()) {
		alert("Les grilles des puzzles de type "+ p_puzzleName + " doivent être carrées. Redimensionner la grille avant de sauvegarder.");
		return;
	}
    if (localStorage.hasOwnProperty(localStorageName)) {
        if (!confirm("Le stockage local a déjà une propriété nommée '" + localStorageName + "'. L'écraser ?")) {
            letsSave = false;
        }
    }
    if (letsSave) {
        var puzzleToSaveString = "";
		// Edit puzzles before moving away 
		p_editorCore.cleanRedundantWalls(); 
        if (p_saveLoadMode.id == PUZZLES_KIND.STAR_BATTLE.id) {
            puzzleToSaveString = starBattlePuzzleToString(p_editorCore.getWallArray(), p_externalOptions.numberStars);
        } else if (p_saveLoadMode.id == PUZZLES_KIND.MASYU.id) {
            puzzleToSaveString = limitedSymbolsWalllessPuzzleToString(p_editorCore.getArray(GRID_ID.PEARL), [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK]);
        } else if (p_saveLoadMode.id == PUZZLES_KIND.CURVING_ROAD.id) {
            puzzleToSaveString = limitedSymbolsWalllessPuzzleToString(p_editorCore.getArray(GRID_ID.PEARL), [SYMBOL_ID.WHITE]);
		} else if (p_saveLoadMode.id == PUZZLES_KIND.REGIONS_PLAYSTATION_SHAPES.id) {
            puzzleToSaveString = limitedSymbolsWallsPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.PLAYSTATION_SHAPES), [SYMBOL_ID.ROUND, SYMBOL_ID.SQUARE, SYMBOL_ID.TRIANGLE]);
		} else if (p_saveLoadMode.id == PUZZLES_KIND.NUMBERS_ONLY.id) {
            puzzleToSaveString = numbersOnlyPuzzleToString(p_editorCore.getArray(GRID_ID.NUMBER_SPACE));
        } else if (p_saveLoadMode.id == PUZZLES_KIND.DIGITS_X_ONLY.id) {
            puzzleToSaveString = puzzleNumbersSymbolsToString(p_editorCore.getArray(GRID_ID.DIGIT_X_SPACE), ["X"]);
        } else if (p_saveLoadMode.id == PUZZLES_KIND.DIGITS_QUESTION_ONLY.id) {
            puzzleToSaveString = puzzleNumbersSymbolsToString(p_editorCore.getArray(GRID_ID.DIGIT_QUESTION_SPACE), ["?"]);
        } else if (p_saveLoadMode.id == PUZZLES_KIND.NUMBERS_X_ONLY.id) {
            puzzleToSaveString = puzzleNumbersSymbolsToString(p_editorCore.getArray(GRID_ID.NUMBER_X_SPACE), ["X"]);
        } else if (p_saveLoadMode.id == PUZZLES_KIND.YAJILIN_LIKE.id) {
            puzzleToSaveString = arrowNumberCombinationsPuzzleToString(p_editorCore.getArray(GRID_ID.YAJILIN_LIKE));
        } else if (p_saveLoadMode.id == PUZZLES_KIND.YAJILIN_BLACK_WHITE.id) {
            puzzleToSaveString = arrowNumberCombinationsBWPuzzleToString(p_editorCore.getArray(GRID_ID.YAJILIN_BLACK_WHITE)); 
        } else if (p_saveLoadMode.id == PUZZLES_KIND.NUMBER_BLACK_WHITE.id) {
            puzzleToSaveString = numbersBWPuzzleToString(p_editorCore.getArray(GRID_ID.NUMBER_BLACK_WHITE)); 
        } else if (p_saveLoadMode.id == PUZZLES_KIND.TAPA.id) {
            sortTapaCluesInGrid(p_editorCore.getArray(GRID_ID.TAPA)); 
            puzzleToSaveString = tapaPuzzleToString(p_editorCore.getArray(GRID_ID.TAPA)); 
        } else if (p_saveLoadMode.id == PUZZLES_KIND.REGIONS_NUMBERS.id) {
			puzzleToSaveString = wallsNumbersPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_SPACE));
		} else if (p_saveLoadMode.id == PUZZLES_KIND.REGIONS_NUMERICAL_INDICATIONS.id) {
			p_editorCore.alignToRegions(GRID_ID.NUMBER_REGION);
			puzzleToSaveString = regionsNumericIndicationsPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_REGION));
        } else if (p_saveLoadMode.id == PUZZLES_KIND.STITCHES.id) {
			puzzleToSaveString = stitchesPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getMarginArray(EDGES.LEFT), p_editorCore.getMarginArray(EDGES.UP), p_externalOptions.numberBounds);
		} else if (p_saveLoadMode.id == PUZZLES_KIND.ONLY_ONE_NUMBER_LEFT_UP_SQUARE.id) {
			puzzleToSaveString = marginOneLeftUpNumbersSquarePuzzleToString(p_editorCore.getMarginArray(EDGES.LEFT), p_editorCore.getMarginArray(EDGES.UP)); 
		} else if (p_saveLoadMode.id == PUZZLES_KIND.SUDOKU.id) {
			const sudokuMode = p_externalOptions.sudokuMode;
			puzzleToSaveString = sudokuPuzzleToString(p_editorCore.getArray(GRID_ID.NUMBER_SPACE), getSudokuWallGrid(sudokuMode).array); 
		} else if (p_saveLoadMode.id == PUZZLES_KIND.GALAXIES.id) {
            puzzleToSaveString = limitedSymbolsWalllessPuzzleToString(p_editorCore.getArray(GRID_ID.GALAXIES), [GALAXIES_POSITION.CENTER, GALAXIES_POSITION.RIGHT, GALAXIES_POSITION.DOWN, GALAXIES_POSITION.RIGHT_DOWN]);
        } else if (p_saveLoadMode.id == PUZZLES_KIND.MOONSUN.id) {
            puzzleToSaveString = moonsunPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.MOONSUN));
        } else if (p_saveLoadMode.id == PUZZLES_KIND.YAGIT.id) {
			puzzleToSaveString = yagitPuzzleToString(p_editorCore.getArray(GRID_ID.YAGIT), p_editorCore.getArray(GRID_ID.KNOTS));
		} else if (p_saveLoadMode.id == PUZZLES_KIND.XS_AND_ONE_O_PER_REGION.id) {
			puzzleToSaveString = XsAndOneOPerRegionPuzzleToString(p_editorCore.getWallGrid(), p_editorCore.getArray(GRID_ID.OX));
		} else if (p_saveLoadMode.id == PUZZLES_KIND.LINKS_ONLY.id) {
			puzzleToSaveString = linksOnlyPuzzleToString(p_editorCore.getLinkArray()); // Note : may be a subterfuge if wallsGrid = linksGrid but that's life...
		} else {
			puzzleToSaveString = wallsOnlyPuzzleToString(p_editorCore.getWallArray());
		}
        localStorage.setItem(localStorageName, puzzleToSaveString);
		// wildcard part
		const puzzleToSaveStringWildcard = wildcardsGridToString(p_editorCore.getArray(GRID_ID.WILDCARD));
		if (puzzleToSaveStringWildcard.length > 0) {			
			localStorage.setItem(wildcardLocalStorageName(localStorageName), puzzleToSaveStringWildcard);
		}
    }
}

function getLoadedStuff(p_kindId, p_localStorageName, p_externalOptions) { // Not the load action ! 
	switch(p_kindId) {
		case PUZZLES_KIND.STAR_BATTLE.id : // Note : some arrays in loadedItem are written several times. But is it a problem as the array is not sliced ?
			return stringToStarBattlePuzzle(localStorage.getItem(p_localStorageName)); break;
		case PUZZLES_KIND.MASYU.id :
			var loadedItem = stringToLimitedSymbolsWalllessPuzzle(localStorage.getItem(p_localStorageName), [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK]);
			loadedItem.desiredIDs = [GRID_ID.PEARL];
			loadedItem.desiredArrays = [loadedItem.symbolArray];
			return loadedItem; break;
		case PUZZLES_KIND.CURVING_ROAD.id : 
			var loadedItem = stringToLimitedSymbolsWalllessPuzzle(localStorage.getItem(p_localStorageName), [SYMBOL_ID.WHITE]);
			loadedItem.desiredIDs = [GRID_ID.PEARL];
			loadedItem.desiredArrays = [loadedItem.symbolArray];
			return loadedItem; break;
		case PUZZLES_KIND.NUMBERS_ONLY.id :
			var loadedItem = stringToNumbersOnlyPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.NUMBER_SPACE];
			loadedItem.desiredArrays = [loadedItem.numberArray];
			return loadedItem; break;
		case PUZZLES_KIND.SUDOKU.id :
			const wallArray = getSudokuWallGrid(p_externalOptions.sudokuMode).array;
			var loadedItem = stringToSudokuPuzzle(localStorage.getItem(p_localStorageName), wallArray);
			loadedItem.wallArray = wallArray;
			loadedItem.desiredIDs = [GRID_ID.NUMBER_SPACE];
			loadedItem.desiredArrays = [loadedItem.numberArray];
			return loadedItem; break;
		case PUZZLES_KIND.DIGITS_X_ONLY.id :
			var loadedItem = stringToNumbersSymbolsPuzzle(localStorage.getItem(p_localStorageName), ["X"]);
			loadedItem.desiredIDs = [GRID_ID.DIGIT_X_SPACE];
			loadedItem.desiredArrays = [loadedItem.numbersSymbolsArray];
			return loadedItem; break;
		case PUZZLES_KIND.DIGITS_QUESTION_ONLY.id :
			var loadedItem = stringToNumbersSymbolsPuzzle(localStorage.getItem(p_localStorageName), ["?"]);
			loadedItem.desiredIDs = [GRID_ID.DIGIT_QUESTION_SPACE];
			loadedItem.desiredArrays = [loadedItem.numbersSymbolsArray];
			return loadedItem; break;
		case PUZZLES_KIND.NUMBERS_X_ONLY.id :
			var loadedItem = stringToNumbersSymbolsPuzzle(localStorage.getItem(p_localStorageName), ["X"]);
			loadedItem.desiredIDs = [GRID_ID.NUMBER_X_SPACE];
			loadedItem.desiredArrays = [loadedItem.numbersSymbolsArray];
			return loadedItem; break;
		case PUZZLES_KIND.YAJILIN_LIKE.id :
			var loadedItem = stringToArrowNumberCombinationsPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.YAJILIN_LIKE];
			loadedItem.desiredArrays = [loadedItem.combinationsArray];
			return loadedItem; break;
		case PUZZLES_KIND.YAJILIN_BLACK_WHITE.id :
			var loadedItem = stringToArrowNumberCombinationsBWPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.YAJILIN_BLACK_WHITE];
			loadedItem.desiredArrays = [loadedItem.combinationsArray];
			return loadedItem; break;
		case PUZZLES_KIND.NUMBER_BLACK_WHITE.id :
			var loadedItem = stringToNumbersBWPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.NUMBER_BLACK_WHITE];
			loadedItem.desiredArrays = [loadedItem.numbersBWArray];
			return loadedItem; break;				
		case PUZZLES_KIND.REGIONS_NUMBERS.id :
			var loadedItem = stringToWallsNumbersPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.NUMBER_SPACE];
			loadedItem.desiredArrays = [loadedItem.numberArray];
			return loadedItem; break;
		case PUZZLES_KIND.REGIONS_PLAYSTATION_SHAPES.id :
			var loadedItem = stringToLimitedSymbolsWallsPuzzle(localStorage.getItem(p_localStorageName), [SYMBOL_ID.ROUND, SYMBOL_ID.SQUARE, SYMBOL_ID.TRIANGLE]);
			loadedItem.desiredIDs = [GRID_ID.PLAYSTATION_SHAPES];
			loadedItem.desiredArrays = [loadedItem.symbolArray];
			return loadedItem; break;
		case PUZZLES_KIND.MOONSUN.id :
			var loadedItem = stringToMoonsunPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.MOONSUN];
			loadedItem.desiredArrays = [loadedItem.symbolArray];
			return loadedItem; break;
		case PUZZLES_KIND.REGIONS_NUMERICAL_INDICATIONS.id :
			var loadedItem = stringToRegionsNumericIndicationsPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.NUMBER_REGION];
			loadedItem.desiredArrays = [getRegionIndicArray(loadedItem)];
			return loadedItem; break;
		case PUZZLES_KIND.TAPA.id :
			var loadedItem = stringToTapaPuzzle(localStorage.getItem(p_localStorageName)); 
			loadedItem.desiredIDs = [GRID_ID.TAPA];
			loadedItem.desiredArrays = [loadedItem.combinationsArray];
			return loadedItem; break;
		case PUZZLES_KIND.STITCHES.id :
			return stringToStitchesPuzzle (localStorage.getItem(p_localStorageName)); break;
		case PUZZLES_KIND.ONLY_ONE_NUMBER_LEFT_UP_SQUARE.id :
			return stringToMarginOneLeftUpNumbersSquarePuzzle(localStorage.getItem(p_localStorageName)); break;
		case PUZZLES_KIND.GALAXIES.id :
			var loadedItem = stringToLimitedSymbolsWalllessPuzzle(localStorage.getItem(p_localStorageName), [GALAXIES_POSITION.CENTER, GALAXIES_POSITION.RIGHT, GALAXIES_POSITION.DOWN, GALAXIES_POSITION.RIGHT_DOWN]);
			loadedItem.desiredIDs = [GRID_ID.GALAXIES];
			loadedItem.desiredArrays = [loadedItem.symbolArray];
			return loadedItem; break;		
		case PUZZLES_KIND.YAGIT.id :
			var loadedItem = stringToYagitPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.YAGIT, GRID_ID.KNOTS];
			loadedItem.desiredArrays = [loadedItem.symbolArray, loadedItem.knotsArray];
			return loadedItem; break;
		case PUZZLES_KIND.XS_AND_ONE_O_PER_REGION.id :
			var loadedItem = stringToXsAndOneOPerRegionPuzzle(localStorage.getItem(p_localStorageName));
			loadedItem.desiredIDs = [GRID_ID.OX];
			loadedItem.desiredArrays = [loadedItem.symbolArray];
			return loadedItem; break;
		case PUZZLES_KIND.LINKS_ONLY.id :
			return stringToLinksOnlyPuzzle(localStorage.getItem(p_localStorageName)); // Contains "linkArray"
		default :
			return stringToWallsOnlyPuzzle(localStorage.getItem(p_localStorageName));
	}
}

/**
Loads the desired grid from the local storage
p_detachedName is the name in the field
*/
editorLoadAction = function (p_canvas, p_drawer, p_editorCore, p_puzzleName, p_detachedName, p_saveLoadMode, p_fieldsToUpdate,  p_externalOptions) {
    var localStorageName = getLocalStorageName(p_puzzleName, p_detachedName);
    if (localStorage.hasOwnProperty(localStorageName)) {
        if (confirm("Charger le puzzle " + localStorageName + " ?")) {
			p_editorCore.maskAllGrids();
			const loadedStuff = getLoadedStuff(p_saveLoadMode.id, localStorageName, p_externalOptions); // loadedStuff and not "loadedItem" because this is an item loaded but with extra properties
			var wallArray = loadedStuff.wallArray;
			if (!wallArray) {
				// Note : all we want is a wallArray with a number of spaces in x and y, should it be empty !
				if (loadedStuff.linkArray) {
					wallArray = p_editorCore.getWallArrayFromLinkArray(loadedStuff.linkArray);
				} else if (loadedStuff.desiredArrays && loadedStuff.desiredArrays.length > 0) {					
					wallArray = generateWallArray(loadedStuff.desiredArrays[0][0].length, loadedStuff.desiredArrays[0].length); 
				} else {
					wallArray = generateWallArray(loadedStuff.marginLeft.length, loadedStuff.marginUp.length);
				}
			}
			p_editorCore.setupFromWallArray(wallArray);
			
			if (loadedStuff.desiredIDs) {
				for (var i = 0 ; i < loadedStuff.desiredIDs.length ; i++) {
					p_editorCore.addGrid(loadedStuff.desiredIDs[i], loadedStuff.desiredArrays[i]);
				}	
			}			
			if (loadedStuff.marginLeft) {
				p_editorCore.setMarginArray(EDGES.LEFT, loadedStuff.marginLeft);
			}
			if (loadedStuff.marginUp) {
				p_editorCore.setMarginArray(EDGES.UP, loadedStuff.marginUp);
			}
			if (loadedStuff.marginRight) {
				p_editorCore.setMarginArray(EDGES.UP, loadedStuff.marginRight);
			}
			if (loadedStuff.marginDown) {
				p_editorCore.setMarginArray(EDGES.UP, loadedStuff.marginDown);
			}
            adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore); 
            updateFieldsAfterLoad(p_fieldsToUpdate, loadedStuff, wallArray[0].length, wallArray.length);

			// wildcard part
			if (localStorage.hasOwnProperty( wildcardLocalStorageName(localStorageName) )) { 
				const wcGrid = stringToWildcardsGrid(localStorage.getItem( wildcardLocalStorageName(localStorageName) ), 
					loadedStuff.desiredArrays[0][0].length, loadedStuff.desiredArrays[0].length);
				p_editorCore.addGrid(GRID_ID.WILDCARD, wcGrid);
			}
        }
    } else {
        alertMissingPuzzle(localStorageName);
    }
}

// Note : function used only twice I guess : in the saving, and in the loading.
function wildcardLocalStorageName(p_localStorageName) {
	return p_localStorageName + "WC";
}

// Updates all relevant fields in HTML
function updateFieldsAfterLoad(p_fieldsToUpdate, p_loadedItem, p_xLength, p_yLength) {
	p_fieldsToUpdate.fieldX.value = p_xLength;
	p_fieldsToUpdate.fieldY.value = p_yLength;
	if (p_loadedItem.starNumber) {
		p_fieldsToUpdate.fieldStars.value = p_loadedItem.starNumber;
	}
	if (p_loadedItem.boundNumber) {
		p_fieldsToUpdate.fieldBounds.value = p_loadedItem.boundNumber;
	}
}

// Utilitary method to get from an item with wallarray and regionIndications (list of {index, value} items) a number array
function getRegionIndicArray(p_loadedItem) {
	const regionArray = WallGrid_data(p_loadedItem.wallArray).toRegionArray(); // This supposes toRegionArray() returns a double-entry array of region numbers ordered by "first spaces in lexical order" in lexical order.
	var regionIndicArray = [];
	var nextIndex = (p_loadedItem.indications.length > 0 ? p_loadedItem.indications[0].index : -1);
	var indicIndex = 0;
	for(var iy = 0 ; iy < regionArray.length ; iy++) {
		regionIndicArray.push([]);
		for(var ix = 0 ; ix < regionArray[0].length; ix++) {
			if ((nextIndex == regionArray[iy][ix]) && nextIndex != -1) {
				regionIndicArray[iy].push(parseInt(p_loadedItem.indications[indicIndex].value, 10));
				indicIndex++;
				if (indicIndex != p_loadedItem.indications.length) {
					nextIndex = p_loadedItem.indications[indicIndex].index;
				} else {
					nextIndex = -1;
				}
			} else {
				regionIndicArray[iy].push(null);
			}
		}
	}
	return regionIndicArray;
}

// --------------------

function switchVisibilityDivAction(p_div) {
	if (p_div.style.display != "none") { // If I said ' == "block"' the first click wouldn't set to 'none' since style.display seems not to be set yet.
		p_div.style.display = "none";
		return;
	}
	p_div.style.display = "block";
	/* Bad solution : https://stackoverflow.com/questions/16132383/changing-div-visibility-with-javascript* https://developer.mozilla.org/fr/docs/Web/CSS/visibility*/
	/* Good solution : https://stackoverflow.com/questions/16132383/changing-div-visibility-with-javascript */
}

// --------------------

/**
Adapts canvas to global grid
p_canvas : the canvas to adapt
p_pix : the Pix item to calculate coordinates
p_editorCore : the Global item the canvas should be adapted to
 */
function adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore) {
    p_drawer.adaptCanvasDimensions(p_canvas, {
		isDotted : !p_editorCore.hasVisibleEdges(),
        xLength : p_editorCore.getXLength(), // WARNING : case of dots puzzles (Slitherlink) : getXLength and getYLength mean the number of meshes !
        yLength : p_editorCore.getYLength(),
		margin : new MarginInfo(p_editorCore.getMarginLeftLength(), p_editorCore.getMarginUpLength(), p_editorCore.getMarginRightLength(), p_editorCore.getMarginDownLength())
    });
}