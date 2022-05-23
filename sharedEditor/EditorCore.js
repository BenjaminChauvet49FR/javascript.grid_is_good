const SELECTED = {
    YES: true,
    NO: false
}

const WILDCARD_CHARACTER = "*";
const CHARACTER_MODE_CHARACTER = 'c'
const SAVE_ONE_MODE_CHARACTER = 's'

function EditorCore(p_xLength, p_yLength, p_parameters) {
	this.isDottedGrid = false;
    this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.initializeGridData();
	this.grids = {};
    this.visibleGrids = {};
	this.margins = {} // left, up, right, down ; values numbers ; shows the expansion from the grid for each edge
	this.buildGrids(p_xLength, p_yLength);
	this.marginInfo = MARGIN_KIND.NONE;
    this.isWithWalls = (!p_parameters || !p_parameters.hasWalls || (p_parameters.hasWalls != false));
	this.resetMargins(); 
	this.inputSybol = null;
	this.nullIsTransparent = false;
	
	// To undo chain prompt
	this.chainInsertData = { 
		valid : false,
		affectedGridNonWildId : null, // TODO only one grid at a time ?
		lastChanges : [] // items with x, y, formerVal, newVal, gridId
	}
	
}

/**
Restarts a grid from scratch.
 */
EditorCore.prototype.restartGrid = function (p_xLength, p_yLength) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.buildGrids(p_xLength, p_yLength);
    this.reinitializeGridData();
}

/**
Resets the grids
*/
EditorCore.prototype.buildGrids = function (p_xLength, p_yLength) {
	this.wallGrid = WallGrid_dim(p_xLength, p_yLength);
	Object.keys(GRID_ID).forEach(id => {
		if (this.grids[GRID_ID[id]]) {
			this.grids[GRID_ID[id]] = Grid_dim(p_xLength, p_yLength);
		}
	});
	this.resetMargins();
}

/**
note : xLength and yLength must be already set.
*/
EditorCore.prototype.resetMargins = function () {
	this.margins = [];
	this.margins[EDGES.LEFT] = [];
	this.margins[EDGES.UP] = [];
	this.margins[EDGES.RIGHT] = [];
	this.margins[EDGES.DOWN] = [];
	for(var i = 0 ; i < this.xLength ; i++) {
		this.margins[EDGES.LEFT].push(null);
		this.margins[EDGES.RIGHT].push(null);
	}
	for(var i = 0 ; i < this.yLength ; i++) {
		this.margins[EDGES.UP].push(null);
		this.margins[EDGES.DOWN].push(null);
	}
}

EditorCore.prototype.setMarginInfo = function (p_marginKind) { // Not reset when a puzzle is reset
	this.marginInfo = p_marginKind;
}

// Only launched on building. ALL data are loaded here.
EditorCore.prototype.initializeGridData = function() {
	this.reinitializeGridData();
	this.inputNumber = 1; // input numbers and symbols are supposed to be defined at start but not modified when data are relaunched afterards
	this.inputSymbol = null; // Note : No input symbol at start
	this.selectionData = {list : []}; // Note : if not initialized, bad surprises ahead !
}

// NB : fonction de convénience. //TODO devrait être renommé "extra grid data" puisque ce sont des données indépendantes des grilles
EditorCore.prototype.reinitializeGridData = function() {
	this.regionArray = null;
    this.selectedCornerSpace = null;
    this.selectedArray = null;
	this.resetSelection();
}

//Set up from non null grids
/**
Performs the required set up from a wall array (a blank one, one that was just modified or a loaded one)
This required setup may include region grid, selection mode...
 */
EditorCore.prototype.setupFromWallArray = function (p_wallArray) {
	this.restartGrid(p_wallArray[0].length, p_wallArray.length);
    this.wallGrid = WallGrid_data(p_wallArray);
}

EditorCore.prototype.addCleanGrid = function (p_id, p_xLength, p_yLength) {
    this.grids[p_id] = Grid_dim(p_xLength, p_yLength);
}

EditorCore.prototype.addGrid = function (p_id, p_array) {
	if (p_array != null && p_array.length > 0) {
	    this.grids[p_id] = Grid_data(p_array, p_array[0].length, p_array.length);
		this.visibleGrids[p_id] = true;
	}
}

EditorCore.prototype.maskAllGrids = function() {
	Object.keys(GRID_ID).forEach(id => {
		if (this.visibleGrids[GRID_ID[id]]) {
			this.visibleGrids[GRID_ID[id]] = false;
		}
	});
	//Credits for all fields in an item : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object/keys
}

EditorCore.prototype.setVisibleGrids = function(p_list) {
	this.maskAllGrids();
	p_list.forEach(id => {
		this.visibleGrids[id] = true;
	});
}

EditorCore.prototype.getVisibleGridIDs = function(p_list) { // Not the same naming as setVisibleGrids : actually good.
	var result = [];
	Object.keys(GRID_ID).forEach(id => {
		if (this.visibleGrids[GRID_ID[id]]) {
			result.push(GRID_ID[id]);
		}
	});
	return result;
}

EditorCore.prototype.setVisibleWildcardGrid = function() {
	this.visibleGrids[GRID_ID.WILDCARD] = true
}

// Resize the grid according to the newly added array, performing all subjacent operations. 
// For this we use the resize operation which works great (why bother changing it ?)
/*EditorCore.prototype.addGridForceSize = function(p_id, p_array) {
	this.updateSelectionData();
	this.transformGrid(GRID_TRANSFORMATION.RESIZE, p_array[0].length, p_array.length); 
	this.addGrid(p_id, p_array);
}*/

EditorCore.prototype.addWalledGridForceSize = function(p_wallArray) {
	this.setupFromWallArray(p_wallArray);
}

// ----------
// Getters

EditorCore.prototype.hasVisibleEdges = function () {
    return this.possessGridWithEdges;
}

EditorCore.prototype.setVisibleEdges = function (p_value) {
    this.possessGridWithEdges = p_value;
}

EditorCore.prototype.getWallArray = function () {
    return this.wallGrid.array;
}

EditorCore.prototype.getPaths = function () {
    return this.pathGrid.array;
}

EditorCore.prototype.getWallGrid = function () {
    return this.wallGrid;
}

EditorCore.prototype.getArray = function(p_index){
	return this.grids[p_index].array;
}

EditorCore.prototype.getGrid = function(p_index){
	return this.grids[p_index];
}

EditorCore.prototype.isVisibleGrid = function(p_index){
	return (this.visibleGrids[p_index] == true);
}

EditorCore.prototype.getSelection = function (p_x, p_y) {
    return this.selectedArray[p_y][p_x];
}

EditorCore.prototype.getSelectedSpaceForRectangle = function () {
    return this.selectedCornerSpace;
}

EditorCore.prototype.getMarginLeftLength = function () {
	return this.marginInfo.leftLength ? this.marginInfo.leftLength : 0;
}
EditorCore.prototype.getMarginUpLength = function () {
	return this.marginInfo.upLength ? this.marginInfo.upLength : 0;
}
EditorCore.prototype.getMarginRightLength = function () {
	return this.marginInfo.rightLength ? this.marginInfo.rightLength : 0;
}
EditorCore.prototype.getMarginDownLength = function () {
	return this.marginInfo.downLength ? this.marginInfo.downLength : 0;
}
EditorCore.prototype.getMarginInfoId = function () {
	return this.marginInfo.id;
}



// Getters and setters

EditorCore.prototype.getInputNumber = function () {
    return this.inputNumber;
}
EditorCore.prototype.setInputNumber = function (p_inputNumber) {
    this.inputNumber = p_inputNumber
}
EditorCore.prototype.getInputSymbol = function () {
    return this.inputSybol;
}
EditorCore.prototype.setInputSymbol = function (p_inputSymbol) {
    this.inputSybol = p_inputSymbol
}
EditorCore.prototype.getInputCombinedArrow = function () {
    return this.inputCombinedArrow;
}
EditorCore.prototype.setInputCombinedArrow = function (p_inputCombinedArrow) {
    this.inputCombinedArrow = p_inputCombinedArrow
}
EditorCore.prototype.getPromptValue = function () {
    return this.promptValue;
}
EditorCore.prototype.setPromptValue = function (p_promptValue) {
    this.promptValue = p_promptValue
}
EditorCore.prototype.setTransparencyState = function (p_nullIsTransparent) {
	this.nullIsTransparent = p_nullIsTransparent;
}


EditorCore.prototype.getWallR = function (p_x, p_y) {
    return this.wallGrid.getWallR(p_x, p_y);
}
EditorCore.prototype.getWallD = function (p_x, p_y) {
    return this.wallGrid.getWallD(p_x, p_y);
}
EditorCore.prototype.getState = function (p_x, p_y) {
    return this.wallGrid.getState(p_x, p_y);
}
EditorCore.prototype.setWallR = function (p_x, p_y, p_state) {
    this.wallGrid.setWallR(p_x, p_y, p_state);
}
EditorCore.prototype.setWallD = function (p_x, p_y, p_state) {
    this.wallGrid.setWallD(p_x, p_y, p_state);
}
EditorCore.prototype.setState = function (p_x, p_y, p_state) {
    this.wallGrid.setState(p_x, p_y, p_state);
}
EditorCore.prototype.switchWallR = function (p_x, p_y) {
    this.wallGrid.switchWallR(p_x, p_y);
}
EditorCore.prototype.switchWallD = function (p_x, p_y) {
    this.wallGrid.switchWallD(p_x, p_y);
}
EditorCore.prototype.switchState = function (p_x, p_y) {
    this.wallGrid.switchState(p_x, p_y);
}

EditorCore.prototype.get = function (p_idGrid, p_x, p_y) {
    return this.grids[p_idGrid].get(p_x, p_y);
}

EditorCore.prototype.getWildcardGrid = function() {
	return this.grids[GRID_ID.WILDCARD];
}

EditorCore.prototype.set = function (p_idGrid, p_x, p_y, p_value) {
	this.grids[GRID_ID.WILDCARD].set(p_x, p_y, null);
    this.grids[p_idGrid].set(p_x, p_y, p_value);
}

EditorCore.prototype.switchWildcardWithGrid = function(p_idGrid, p_x, p_y) {
	const wasWildCard = this.grids[GRID_ID.WILDCARD].get(p_x, p_y) == WILDCARD_CHARACTER;
	this.set(p_idGrid, p_x, p_y, null);
	this.set(GRID_ID.WILDCARD, p_x, p_y, wasWildCard ? null : WILDCARD_CHARACTER);
}

EditorCore.prototype.switchValue = function (p_idGrid, p_x, p_y, p_value) {
	this.grids[p_idGrid].toggle(p_x, p_y, p_value);
	this.grids[GRID_ID.WILDCARD].set(p_x, p_y, null);
}


EditorCore.prototype.clearSpaceContents = function (p_x, p_y) {
	Object.keys(GRID_ID).forEach(id => {
		if (this.visibleGrids[GRID_ID[id]]) {
			this.set(GRID_ID[id], p_x, p_y, null);
		}
	});
}

EditorCore.prototype.getXLength = function () {		
	return this.xLength;
}

EditorCore.prototype.getYLength = function () {
	return this.yLength;
}

EditorCore.prototype.setWallsOn = function () {
    this.isWithWalls = true;
}

EditorCore.prototype.setWallsOff = function () {
    this.isWithWalls = false;
}

EditorCore.prototype.hasWalls = function () {
    return this.isWithWalls == true;
}

EditorCore.prototype.getMarginEntry = function(p_edge, p_index) {
	return this.margins[p_edge][p_index];
}
EditorCore.prototype.setMarginEntry = function(p_edge, p_index, p_value) {
	this.margins[p_edge][p_index] = p_value;
}
EditorCore.prototype.getMarginArray = function(p_edge) {
	return this.margins[p_edge];
}
EditorCore.prototype.setMarginArray = function(p_edge, p_array) {
	this.margins[p_edge]= p_array;
}

// --------------------
// Grid transformations

// If no spaces are selected, transform everything.
// If some spaces are selected, do not touch wall grid + transform locally all spaces. 
// IMPORTANT : this.selectionData should be up to date !
EditorCore.prototype.transformGrid = function (p_transformation, p_xNewLength, p_yNewLength) {
	this.reinitializeGridData();
	const formerXLength = this.xLength;
	const formerYLength = this.yLength;
	if (this.selectionData.list.length == 0 || p_transformation == GRID_TRANSFORMATION.RESIZE) { // Global
		this.wallGrid.transform(p_transformation, p_xNewLength, p_yNewLength);
		this.xLength = this.wallGrid.getXLength();
		this.yLength = this.wallGrid.getYLength();
		for (const id in this.grids) {
			if (p_transformation == GRID_TRANSFORMATION.RESIZE || !this.notInSpaces(id)) {				
				this.grids[id].transform(p_transformation, p_xNewLength, p_yNewLength, isOrientedGrid(id));
			}
		}
		this.transformMargins(p_transformation, formerXLength, formerYLength);
	} else { // Local
		for (const id in this.grids) {
			if (!this.notInSpaces(id)) {				
				this.grids[id].transformLocal(p_transformation, this.selectionData.list, 
				(this.selectionData.xMin+this.selectionData.xMax)/2, 
				(this.selectionData.yMin+this.selectionData.yMax)/2, isOrientedGrid(id));
			}
		}
	}
	this.resetSelection();
}

EditorCore.prototype.transformMargins = function(p_transformation, p_formerXLength, p_formerYLength) {
	if (this.getMarginRightLength() == 0) {
		this.margins[EDGES.RIGHT] = this.margins[EDGES.LEFT].slice();
	}
	if (this.getMarginDownLength() == 0) {
		this.margins[EDGES.DOWN] = this.margins[EDGES.UP].slice(); // Note : mind the use of slice
	}
	switch(p_transformation) {
		case GRID_TRANSFORMATION.ROTATE_CW :
			this.replacementMarginsCycle([EDGES.LEFT, EDGES.UP, EDGES.RIGHT, EDGES.DOWN]);
			this.margins[EDGES.UP].reverse();
			this.margins[EDGES.DOWN].reverse(); break;
		case GRID_TRANSFORMATION.ROTATE_CCW :
			this.replacementMarginsCycle([EDGES.LEFT, EDGES.DOWN, EDGES.RIGHT, EDGES.UP]);
			this.margins[EDGES.LEFT].reverse();
			this.margins[EDGES.RIGHT].reverse(); break;
		case GRID_TRANSFORMATION.ROTATE_UTURN :
			this.replacementMarginsCycle([EDGES.UP, EDGES.DOWN]);
			this.replacementMarginsCycle([EDGES.LEFT, EDGES.RIGHT]);
			Object.keys(EDGES).forEach(dir => {
				this.margins[EDGES[dir]].reverse();
			}); break;
		case GRID_TRANSFORMATION.MIRROR_VERTICAL :
			this.replacementMarginsCycle([EDGES.UP, EDGES.DOWN]);
			this.margins[EDGES.LEFT].reverse();
			this.margins[EDGES.RIGHT].reverse(); break;
		case GRID_TRANSFORMATION.MIRROR_HORIZONTAL : 
			this.replacementMarginsCycle([EDGES.LEFT, EDGES.RIGHT]);
			this.margins[EDGES.UP].reverse();
			this.margins[EDGES.DOWN].reverse(); break;
		case GRID_TRANSFORMATION.RESIZE : 
			// New grid larger than previous ones ? Margins need to be extended as well.
			for (var x = p_formerXLength ; x < this.xLength ; x++) {
				this.margins[EDGES.UP].push(null); // Note : default values for margins are supposed to be null
				this.margins[EDGES.DOWN].push(null);
			}
			for (var y = p_formerYLength ; y < this.yLength ; y++) {
				this.margins[EDGES.LEFT].push(null);
				this.margins[EDGES.RIGHT].push(null);
			}
			// New grid smaller ? Remove previous elements !
			for (var x = this.xLength ; x < p_formerXLength ; x++) {
				this.margins[EDGES.UP].pop();
				this.margins[EDGES.DOWN].pop();
			}
			for (var y = this.yLength ; y < p_formerYLength ; y++) {
				this.margins[EDGES.LEFT].pop();
				this.margins[EDGES.RIGHT].pop();
			}
	}
}

EditorCore.prototype.replacementMarginsCycle = function(p_edgesOrder) { // Note : margins are not "oriented" yet, but it may change soon... well, someday I'll make such a solver.
	var tmp = this.margins[p_edgesOrder[p_edgesOrder.length - 1]].slice();
	for (var i = p_edgesOrder.length-2 ; i >= 0 ; i--) {
		this.margins[p_edgesOrder[i+1]] = this.margins[p_edgesOrder[i]].slice(); // Note : mind the use of slice
	}
	this.margins[p_edgesOrder[0]] = tmp;
}

//-------------------------------------------
// Chain insertion

const INPUT_PLACE_KIND = {
	GRID : 0,
	MARGIN : 1
}

EditorCore.prototype.insertChainGrid = function(p_gridId, p_valuesChain, p_validityMethod, p_parameters, p_x, p_y, p_hasWildcardsSelected) {
	this.insertChainPrivate(INPUT_PLACE_KIND.GRID, p_gridId, p_valuesChain, p_validityMethod, p_parameters, p_x, p_y, this.getXLength(), p_hasWildcardsSelected);
}

EditorCore.prototype.insertChainMargin = function(p_edge, p_valuesChain, p_validityMethod, p_parameters, p_index) {
	const appropriateLength = ((p_edge == EDGES.LEFT || p_edge == EDGES.RIGHT) ? this.getYLength() : this.getXLength());
	this.insertChainPrivate(INPUT_PLACE_KIND.MARGIN, p_edge, p_valuesChain, p_validityMethod, p_parameters, p_index, -1, appropriateLength);
}

// See below for p_destinationKind and p_destinationNomination
// Also, p_x, p_y are coordinates if we use grid, but not otherwise ! p_length1, p_length2 are supposed to be the size of the desired array so... grid or margin
// selectionData must be updated
EditorCore.prototype.insertChainPrivate = function(p_destinationKind, p_destinationNomination, p_valuesChain, p_validityMethod, p_parameters, p_x, p_y, p_length1, p_hasWildcardsSelected) {
	if (p_destinationKind == INPUT_PLACE_KIND.GRID) {
		this.chainInsertData.valid = true;
		this.chainInsertData.lastChanges = [];
		this.chainInsertData.affectedGridNonWildId = p_destinationNomination;		
	}
	
	// Blank character and monocharacter
	const selectionMode = (this.selectionData.list.length > 0 && p_destinationKind == INPUT_PLACE_KIND.GRID);
	var listTS; //TS = target spaces
	var indexlistTS;
	var formerValues = [];
	if (selectionMode) {
		listTS = [];
		indexlistTS = 0;
		// selectionData.list is correctly ordonnated, right ?
		this.selectionData.list.forEach(coors => {
			if ((coors.y > p_y || (coors.y == p_y && coors.x >= p_x)) && (!p_hasWildcardsSelected || this.grids[GRID_ID.WILDCARD].get(coors.x, coors.y) == WILDCARD_CHARACTER)) {
				listTS.push({x : coors.x, y : coors.y});
			}
		});
	}
	// Pre-options
	var startIndexToken = 0;
	var monoChar = p_parameters.isMonoChar;
	var emptyChar = p_parameters.emptySpaceChar;
	var saveOneCharacter = false; 			 // NOte : add some "this." instead of passing lots of parameters ?
	var moveOnParameters = true;
	while(moveOnParameters) {
		if (startIndexToken < p_valuesChain.length) {			
			switch(p_valuesChain.charAt(startIndexToken)) {
				case CHARACTER_MODE_CHARACTER :
					monoChar = true;
					emptyChar = ' ';
				break;
				case SAVE_ONE_MODE_CHARACTER :
					saveOneCharacter = true;
				break;
				default : 
					startIndexToken--;
					moveOnParameters = false;
				break;
			}
		} else {
			startIndexToken--;
			moveOnParameters = false;
		}
		startIndexToken++;
	}
	var valuesChain = p_valuesChain.substring(startIndexToken);
	
	// The main chain, now
	if (valuesChain != null) {
		var tokens;
		var tokensNumber;
		if (monoChar) {
			tokensNumber = valuesChain.length;
		} else {
			tokens = valuesChain.substring(startIndexToken).split(" ");
			tokensNumber = tokens.length;
		}
		var x, y; // Starting positions
		if (selectionMode) {
			x = listTS[0].x;
			y = listTS[0].y;
		} else {
			x = p_x;
			y = p_y;
		}
		var indexToken = 0;
		var validXY = true;
		while (validXY && indexToken < tokensNumber) {
			var value = (monoChar ? valuesChain.charAt(indexToken) : tokens[indexToken]);
			var ok = false;
			var formerValue = this.getAppropriatePlace(p_destinationKind, p_destinationNomination, x, y);
			var newValue = (saveOneCharacter && formerValue.length > 0 ? formerValue.charAt(0) : "") + value;
			if (p_validityMethod(newValue)) {
				var realValue = (newValue != "" ? newValue : null);
				realValue = (p_parameters.isNumeric && realValue != null) ? parseInt(realValue, 10) : realValue;
				this.setAppropriatePlace(p_destinationKind, p_destinationNomination, x, y, realValue, formerValue);
				ok = true;
			}
			// Empty spaces (what are we living for ?) Handle several characters at once
			if (!monoChar && (value.charAt(0) == emptyChar)) {
				this.eraseAppropriatePlace(p_destinationKind, p_destinationNomination, x, y);
				var indexClue = 1;
				var validXYLocal = true;
				while((indexClue < value.length) && (value.charAt(indexClue) == emptyChar) && validXYLocal) {
					if (selectionMode) {
						if (indexlistTS <= listTS.length) {
							indexlistTS++;
							x = listTS[indexlistTS].x;
							y = listTS[indexlistTS].y;
						} else {
							validXYLocal = false;
						}
					} else {
						if (x <= p_length1-2) {							
							x++;
						} else {
							validXYLocal = false;
						}
					}
					if (validXYLocal) {
						this.eraseAppropriatePlace(p_destinationKind, p_destinationNomination, x, y);
						indexClue++;
					}
				}
				ok = (indexClue == value.length);
			}
			// Empty space : handle only one character
			if (monoChar && (value == emptyChar)) {
				this.eraseAppropriatePlace(p_destinationKind, p_destinationNomination, x, y);
				ok = true;
			}
			if (!ok) {
				break;
			}
			// Reached the end of writable area ?
			if (value != "") {
				if (selectionMode) {
					indexlistTS++
					validXY = (indexlistTS < listTS.length);
					if (validXY) {
						x = listTS[indexlistTS].x;
						y = listTS[indexlistTS].y;
					}
				} else {
					x++
					validXY = (x < p_length1);
				};
			}
			indexToken++;
		}
		if ((tokensNumber == 1) && ok) { // If only one symbol, save it
			this.setPromptValue(value);
		}
		// Clean wildcards that have been consumed (Note : I wish wildcards were always cleaned with characters... but instead we write it manually.)
		if (p_destinationKind == INPUT_PLACE_KIND.GRID) {			
			if (selectionMode) {
				listTS.forEach(coors => {
					x = coors.x;
					y = coors.y;
					// Note : the selection doesn't always have wildcards
					this.removeWildcardFromChainInsertion(p_destinationNomination, x, y);
				});
			} else {
				const xMax = x-1;
				for (x = p_x; x <= xMax; x++) {
					this.removeWildcardFromChainInsertion(p_destinationNomination, x, p_y);
				}
			}			
		}
	}
}

// Removes a wildcard from an insertion and adds it for the undoing
EditorCore.prototype.removeWildcardFromChainInsertion = function(p_gridId, p_x, p_y) {
	if (this.get(p_gridId, p_x, p_y) != null && this.grids[GRID_ID.WILDCARD].get(p_x, p_y) != null) {
		this.grids[GRID_ID.WILDCARD].set(p_x, p_y, null);
		this.chainInsertData.lastChanges.push({x : p_x, y : p_y, wasWildCard : true});
	}	
}

// Put value into place (space, margin, or whatever...). Role of "destination nomination" is given here.
EditorCore.prototype.setAppropriatePlace = function (p_destinationKind, p_destinationNomination, p_x, p_y, p_val, p_formerValue) {
	var val = p_val;
	switch(p_destinationKind) {
		case INPUT_PLACE_KIND.GRID :  // p_destinationNomination = id of the grid
			this.chainInsertData.lastChanges.push({x : p_x, y : p_y, formerVal : p_formerValue, wasWildCard : this.grids[GRID_ID.WILDCARD].get(p_x, p_y) == WILDCARD_CHARACTER, newVal : val});
			this.set(p_destinationNomination, p_x, p_y, val);
		break;
		case INPUT_PLACE_KIND.MARGIN :  // p_destinationNomination = EDGES.LEFT, UP, RIGHT, DOWN. Only the first coordinate matters.
			this.setMarginEntry(p_destinationNomination, p_x, val);
		break;
	}
}

// Only for former value. Suboptimal but hey...
EditorCore.prototype.getAppropriatePlace = function(p_destinationKind, p_destinationNomination, p_x, p_y) {
	switch(p_destinationKind) {
		case INPUT_PLACE_KIND.GRID : 
			return this.get(p_destinationNomination, p_x, p_y);
		break;
		case INPUT_PLACE_KIND.MARGIN : 
			return this.getMarginEntry(p_destinationNomination, p_x);
		break;
	}
}

// C/P onto setAppropriatePlace, hence the stay-in-place
EditorCore.prototype.eraseAppropriatePlace = function(p_destinationKind, p_destinationNomination, p_x, p_y) {
	switch(p_destinationKind) {
		case INPUT_PLACE_KIND.GRID :
			const formerValue = this.get(p_destinationNomination, p_x, p_y);
			this.chainInsertData.lastChanges.push({x : p_x, y : p_y, wasWildCard : this.grids[GRID_ID.WILDCARD].get(p_x, p_y) == WILDCARD_CHARACTER, formerVal : formerValue, newVal : null});
			this.set(p_destinationNomination, p_x, p_y, null);
		break;
		case INPUT_PLACE_KIND.MARGIN : 
			this.setMarginEntry(p_destinationNomination, p_x, null);
		break;
	}
}

EditorCore.prototype.undoLastChainGridInsert = function() {
	const nonWildId = this.chainInsertData.affectedGridNonWildId;
	var cancellable = (this.chainInsertData.valid && this.isVisibleGrid(this.chainInsertData.affectedGridNonWildId));
	if (cancellable) {
		var i = 0;
		var change;
		while (cancellable && i < this.chainInsertData.lastChanges.length) {
			change = this.chainInsertData.lastChanges[i];
			cancellable = (change.x < this.xLength && change.y < this.yLength && this.get(nonWildId, change.x, change.y) == change.newVal);
			i++;
		}
	}
	if (cancellable) {
		this.chainInsertData.lastChanges.forEach(change => {
			if (change.wasWildCard) {	
				this.set(nonWildId, change.x, change.y, null);
				this.set(GRID_ID.WILDCARD, change.x, change.y, WILDCARD_CHARACTER);			
			} else {
				this.set(nonWildId, change.x, change.y, change.formerVal);
				this.set(GRID_ID.WILDCARD, change.x, change.y, null);
			}
		});
	}
	this.chainInsertData.valid = false;
	return cancellable;
}


//-------------------------------------------
// Selections 

EditorCore.prototype.updateSelectionData = function() {
	var xMin = this.xLength;
	var yMin = this.yLength;
	var xMax = -1;
	var yMax = -1;
	var listCoors = [];
	var hasWC = false;
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (this.selectedArray[iy][ix] == SELECTED.YES) {
				xMin = Math.min(ix, xMin);
				xMax = Math.max(ix, xMax);
				yMin = Math.min(iy, yMin);
				yMax = iy;
				listCoors.push({x : ix, y : iy});
				if (this.get(GRID_ID.WILDCARD, ix, iy) == WILDCARD_CHARACTER) {
					hasWC = true;
				}
			}
		}
	}
	this.selectionData = {list : listCoors, xMin : xMin, xMax : xMax, yMin : yMin, yMax : yMax, hasWildcard : hasWC}
}

// Note : for getters about selection not about the spaces themselves, 'selection data' must have been updated !
EditorCore.prototype.getNumberSelectedSpaces = function() {
	return this.selectionData.list.length;
}

EditorCore.prototype.hasWildcardsSelected = function() {
	return this.selectionData.hasWildcard
}

EditorCore.prototype.getXMinSelected = function() {return this.selectionData.xMin;}
EditorCore.prototype.getXMaxSelected = function() {return this.selectionData.xMax;}
EditorCore.prototype.getYMinSelected = function() {return this.selectionData.yMin;}
EditorCore.prototype.getYMaxSelected = function() {return this.selectionData.yMax;}



EditorCore.prototype.switchSelectedSpace = function (p_x, p_y) {
    if (this.selectedArray[p_y][p_x] == SELECTED.YES) {
		this.selectedArray[p_y][p_x] = SELECTED.NO;
		return;
	}
	this.selectedArray[p_y][p_x] = SELECTED.YES;
}

EditorCore.prototype.selectRectangleMechanism = function (p_x, p_y) {
    if (this.selectedCornerSpace == null) {
        this.selectedCornerSpace = {
            x : p_x,
			y : p_y
        };
    } else {
        const xMin = Math.min(this.selectedCornerSpace.x, p_x);
        const yMin = Math.min(this.selectedCornerSpace.y, p_y);
        const xMax = Math.max(this.selectedCornerSpace.x, p_x);
        const yMax = Math.max(this.selectedCornerSpace.y, p_y);
		if ((xMin == xMax) && (yMin == yMax)) {
			this.switchSelectedSpace(xMin, yMin);
		} else {
			var ix, iy;
			iy = yMin;  ix = xMin;
			var foundNS = false;
			while (iy <= yMax && !foundNS) {
				foundNS = this.selectedArray[iy][ix] == SELECTED.NO;
				ix++; 
				if (ix > xMax) {
					ix = xMin;
					iy++;
				}
			}
			const selectSpaces = foundNS ? SELECTED.YES : SELECTED.NO;
			
			for (ix = xMin; ix <= xMax; ix++) {
				for (iy = yMin; iy <= yMax; iy++) {
					this.selectedArray[iy][ix] = selectSpaces;
				}
			}
		}
        this.selectedCornerSpace = null;
    }
}

EditorCore.prototype.unselectAll = function () {
    for (var iy = 0; iy < this.getYLength(); iy++) {
        for (var ix = 0; ix < this.getXLength(); ix++) {
            this.selectedArray[iy][ix] = SELECTED.NO;
        }
    }
    this.selectedCornerSpace = null;
}

EditorCore.prototype.selectAll = function () {
	for (var iy = 0; iy < this.getYLength(); iy++) {
        for (var ix = 0; ix < this.getXLength(); ix++) {
            this.selectedArray[iy][ix] = SELECTED.YES;
        }
    }
    this.selectedCornerSpace = null;
}

EditorCore.prototype.unselectNull = function () {
    const visibleID = this.getVisibleGridIDs();
	for (var iy = 0; iy < this.getYLength(); iy++) {
        for (var ix = 0; ix < this.getXLength(); ix++) {
			if (this.selectedArray[iy][ix] == SELECTED.YES) {				
				for(var i = 0 ; i < visibleID.length ; i++) {				
					if (this.get(visibleID[i], ix, iy) != null) {					
						this.selectedArray[iy][ix] = SELECTED.YES;
						break;
					}
					this.selectedArray[iy][ix] = SELECTED.NO;
				}
			}
        }
    }
    this.selectedCornerSpace = null;
} 

EditorCore.prototype.resetSelection = function () {
    this.selectedArray = [];
    for (var iy = 0; iy < this.getYLength(); iy++) {
        this.selectedArray.push([]);
        for (var ix = 0; ix < this.getXLength(); ix++) {
            this.selectedArray[iy].push(SELECTED.NO);
        }
    }
    this.selectedCornerSpace = null;
}

EditorCore.prototype.buildWallsAroundSelection = function () {
    for (var y = 0; y < this.getYLength(); y++) {
        for (var x = 0; x < this.getXLength(); x++) {
			if (this.selectedArray[y][x] == SELECTED.YES) {
				existingNeighborsCoorsDirections(x, y, this.xLength, this.yLength).forEach(coorsDir => {
					if (this.selectedArray[coorsDir.y][coorsDir.x] == SELECTED.NO) {
						this.wallGrid.setWall(x, y, coorsDir.direction, WALLGRID.CLOSED);
					}
				});
			}
        }
    }
    this.unselectAll();
}

EditorCore.prototype.countSpacesSelection = function() {
	var result = 0;
	for (var y = 0; y < this.getYLength(); y++) {
        for (var x = 0; x < this.getXLength(); x++) {
			if (this.selectedArray[y][x] == SELECTED.YES) {
				result ++;
			}
		}
	}
	return result;
}

EditorCore.prototype.moveCopySelection = function(p_deltaX, p_deltaY, p_move, p_transparencyNull) { // Note : Is everything okay ? I wrote "traquer ça"
	const progressX = p_deltaX >= 0 ? -1 : 1;
	const startX = p_deltaX >= 0 ? this.getXLength()-1 : 0;
	const overEndX = p_deltaX >= 0 ? -1 : this.getXLength();
	const progressY = p_deltaY >= 0 ? -1 : 1;
	const startY = p_deltaY >= 0 ? this.getYLength()-1 : 0;
	const overEndY = p_deltaY >= 0 ? -1 : this.getYLength();
	for (var y = startY ; y != overEndY ; y += progressY) {
		for (var x = startX ; x != overEndX ; x += progressX) {
			this.moveCopySpace(x, y, p_deltaX, p_deltaY, p_move, p_transparencyNull);
		}
	}
}

EditorCore.prototype.moveCopySpace = function(p_x, p_y, p_deltaX, p_deltaY, p_move, p_transparencyNull) {
	const xDest = p_x + p_deltaX;
	const yDest = p_y + p_deltaY;
	if (this.selectedArray[p_y][p_x]) { 
		this.selectedArray[p_y][p_x] = false;
		if ((xDest < 0) || (xDest >= this.getXLength()) || (yDest < 0) || (yDest >= this.getYLength())) {
			if (p_move) {
				Object.keys(GRID_ID).forEach(id => {
					if (!this.notInSpaces(id)) {						
						if (this.visibleGrids[GRID_ID[id]]) {
							this.set(GRID_ID[id], p_x, p_y, null);
						}
					}
				});
			}
		} else {
			this.selectedArray[yDest][xDest] = true;
			Object.keys(GRID_ID).forEach(id => {
				if (this.grids[GRID_ID[id]] && (!this.nullIsTransparent || (this.get(GRID_ID[id], p_x, p_y) != null))) {
					if (!this.notInSpaces(id)) {
						this.set(GRID_ID[id], xDest, yDest, this.get(GRID_ID[id], p_x, p_y));
						if (p_move) {
							this.set(GRID_ID[id], p_x, p_y, null);
						}
					}
				}
			});
		}
	}
}
// Nodes are excluded from copy ?

EditorCore.prototype.clearContentsSelection = function() {
	for (var y = 0; y < this.getYLength(); y++) {
        for (var x = 0; x < this.getXLength(); x++) {
			if (this.selectedArray[y][x] == SELECTED.YES) {
				this.clearSpaceContents(x, y);
			}
		}
	}
	this.resetSelection();
}

//-------------------------------------------
// Parameters for / about grids

function isOrientedGrid(p_name) {
	return (p_name == GRID_ID.YAJILIN_LIKE || p_name == GRID_ID.YAJILIN_BLACK_WHITE);
}

// Corners don't include Galaxies !
EditorCore.prototype.relevantCorners = function () {
	return (this.visibleGrids[GRID_ID.KNOTS]);
}

EditorCore.prototype.hasCornersGridToBeMoved = function() {
	return (this.visibleGrids[GRID_ID.KNOTS]);
}

EditorCore.prototype.notInSpaces = function(p_name) {
	return (p_name == GRID_ID.KNOTS || p_name == GRID_ID.GALAXIES);
}

//-------------------------------------------
// Pack of methods for 'Galaxies' puzzle, as it is kind of unique
// Note : a space cannot contain two different spaces ; since the positions are center, R, D and RD, not all centers are erased when a new is added.

EditorCore.prototype.isGalaxy = function() {
	return this.visibleGrids[GRID_ID.GALAXIES];
}

EditorCore.prototype.manageGalaxyGridRightDown = function(p_x, p_y) {
	this.switchValue(GRID_ID.GALAXIES, p_x, p_y, GALAXIES_POSITION.RIGHT_DOWN);
	this.set(GRID_ID.GALAXIES, p_x, p_y+1, null);
	this.set(GRID_ID.GALAXIES, p_x+1, p_y, null);
	this.set(GRID_ID.GALAXIES, p_x+1, p_y+1, null);
	if (p_y > 0) {
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.DOWN);
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
		this.conditionalEraseSpaceGalaxies(p_x+1, p_y-1, GALAXIES_POSITION.DOWN);
		this.conditionalEraseSpaceGalaxies(p_x+1, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
	}
	if (p_x > 0) {
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT_DOWN);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y+1, GALAXIES_POSITION.RIGHT);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y+1, GALAXIES_POSITION.RIGHT_DOWN);
		if (p_y > 0) {
			this.conditionalEraseSpaceGalaxies(p_x-1, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
		}
	}
}

EditorCore.prototype.manageGalaxyGridRight = function(p_x, p_y) {
	this.switchValue(GRID_ID.GALAXIES, p_x, p_y, GALAXIES_POSITION.RIGHT);
	this.set(GRID_ID.GALAXIES, p_x + 1, p_y, null);
	if (p_y > 0) {
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.DOWN);
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
		this.conditionalEraseSpaceGalaxies(p_x+1, p_y-1, GALAXIES_POSITION.DOWN);
		this.conditionalEraseSpaceGalaxies(p_x+1, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
	}
	if (p_x > 0) {
		if (p_y > 0) {
			this.conditionalEraseSpaceGalaxies(p_x-1, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
		}
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT_DOWN);
	}
}

EditorCore.prototype.manageGalaxyGridDown = function(p_x, p_y) {
	this.switchValue(GRID_ID.GALAXIES, p_x, p_y, GALAXIES_POSITION.DOWN);
	this.set(GRID_ID.GALAXIES, p_x, p_y + 1, null);
	if (p_x > 0) {
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT_DOWN);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y+1, GALAXIES_POSITION.RIGHT);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y+1, GALAXIES_POSITION.RIGHT_DOWN);
	}
	if (p_y > 0) {
		if (p_x > 0) {
			this.conditionalEraseSpaceGalaxies(p_x-1, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
		}
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.DOWN);
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
	}
}

EditorCore.prototype.manageGalaxyGridSpace = function(p_x, p_y) {
	this.switchValue(GRID_ID.GALAXIES, p_x, p_y, GALAXIES_POSITION.CENTER);
	if (p_x > 0) {
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT);
		this.conditionalEraseSpaceGalaxies(p_x-1, p_y, GALAXIES_POSITION.RIGHT_DOWN);
	}
	if (p_y > 0) {
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.DOWN);
		this.conditionalEraseSpaceGalaxies(p_x, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
		if (p_x > 0) {
			this.conditionalEraseSpaceGalaxies(p_x-1, p_y-1, GALAXIES_POSITION.RIGHT_DOWN);
		}
	}
}

EditorCore.prototype.conditionalEraseSpaceGalaxies = function(p_xCond, p_yCond, p_posCond) {
	if (this.get(GRID_ID.GALAXIES, p_xCond, p_yCond) == p_posCond) {
		this.set(GRID_ID.GALAXIES, p_xCond, p_yCond, null);
	}
}

// -------------------------------------------
// "links" subterfuge for EditorCore (it actually uses walls)
EditorCore.prototype.setLinksOnly = function() {
	this.isWithWalls = true;
	this.possessGridWithEdges = false;
}

EditorCore.prototype.holdsLinks = function() {
	return this.isWithWalls && !this.possessGridWithEdges;
}

EditorCore.prototype.getLinkR = function (p_x, p_y) { // Some copy-pastes that aren't seen from outside... ?
	return this.getWallR(p_x, p_y);
}
EditorCore.prototype.getLinkD = function (p_x, p_y) {
	return this.getWallD(p_x, p_y);
}
EditorCore.prototype.switchLinkR = function (p_x, p_y) {
    this.wallGrid.switchWallR(p_x, p_y);
}
EditorCore.prototype.switchLinkD = function (p_x, p_y) {
    this.wallGrid.switchWallD(p_x, p_y);
}
EditorCore.prototype.getWallArrayFromLinkArray = function(p_linkArray) { // Now THIS is subterfuge bureaucracy. Especially since this method body doesn't reference the editor...
	return p_linkArray;
}
EditorCore.prototype.getLinkArray = function() {
	return this.getWallArray();
}

// -------------------------------------------
// Misc. specific.
// For Suraromu
EditorCore.prototype.cleanRedundantGates = function () {
	var chain;
	var removeDots;
	var x, y;
	for (y = 0; y < this.getYLength(); y++) {
		removeDots = false;
        for (x = 0; x < this.getXLength(); x++) {
			chain = this.get(GRID_ID.SURAROMU, x, y);
			if (chain != null) {
				if (removeDots && chain.charAt(0) == SYMBOL_ID.HORIZONTAL_DOTS) {
					this.set(GRID_ID.SURAROMU, x, y, null);					
				} else if (chain == SYMBOL_ID.X) {
					removeDots = false;
				} else if (chain.charAt(0) == SYMBOL_ID.HORIZONTAL_DOTS) {
					removeDots = true;
				}
			}
		}
	}        
	for (x = 0; x < this.getXLength(); x++) {
		removeDots = false;
		for (y = 0; y < this.getYLength(); y++) {
			chain = this.get(GRID_ID.SURAROMU, x, y);
			if (chain != null) {
				if (removeDots && chain.charAt(0) == SYMBOL_ID.VERTICAL_DOTS) {
					this.set(GRID_ID.SURAROMU, x, y, null);					
				} else if (chain == SYMBOL_ID.X) {
					removeDots = false;
				} else if (chain.charAt(0) == SYMBOL_ID.VERTICAL_DOTS) {
					removeDots = true;
				}
			}
		}
	}

}

// -------------------------------------------
// Misc.

EditorCore.prototype.clearWallsAround = function (p_x, p_y) {
	existingNeighborsDirections(p_x, p_y, this.xLength, this.yLength).forEach(dir => {
		this.wallGrid.setWall(p_x, p_y, dir, WALLGRID.OPEN);
	});
}

EditorCore.prototype.alignToRegions = function (p_idGrid) {
    this.grids[p_idGrid].arrangeSymbols(this.wallGrid.toRegionArray());
}

EditorCore.prototype.cleanRedundantWalls = function () { // Note : name transfer...
    this.wallGrid.cleanRedundantWalls();
}
