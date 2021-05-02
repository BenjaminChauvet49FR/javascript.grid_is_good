const SELECTED = {
    YES: true,
    NO: false
}

const GRID_ID = {
    NUMBER_REGION: 'NR',
    NUMBER_SPACE: 'NS',
    DIGIT_X_SPACE: 'DXS',
    PEARL: 'P',
	YAJILIN_LIKE: 'YAJILIN' 
}

const GRID_TRANSFORMATION = {
	ROTATE_CW : "RCW",
	ROTATE_CCW : "RCCW",
	ROTATE_UTURN : "RUT",
	MIRROR_HORIZONTAL : "MH",
	MIRROR_VERTICAL : "MV",
	RESIZE : "Rs"
}

function EditorCore(p_xLength, p_yLength, p_parameters) {
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
	this.possessWallGrid = true;
}

// NB : fonction de convénience. //TODO devrait être renommé "extra grid data" puisque ce sont des données indépendantes des grilles
EditorCore.prototype.reinitializeGridData = function() {
	this.regionArray = null;
    this.isRegionGridValid = true;
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

// ----------
// Getters

EditorCore.prototype.hasWallGrid = function () {
    return this.possessWallGrid;
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
    this.wallGrid.setWallR(p_x, p_y);
}
EditorCore.prototype.setWallD = function (p_x, p_y, p_state) {
    this.wallGrid.setWallD(p_x, p_y);
}
EditorCore.prototype.setState = function (p_x, p_y, p_state) {
    this.wallGrid.setState(p_x, p_y);
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

EditorCore.prototype.set = function (p_idGrid, p_x, p_y, p_value) {
    this.grids[p_idGrid].set(p_x, p_y, p_value);
}

EditorCore.prototype.clear = function (p_idGrid, p_x, p_y) {
    this.grids[p_idGrid].clear(p_x, p_y);
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


EditorCore.prototype.transformGrid = function (p_transformation, p_xDatum, p_yDatum) {
	this.reinitializeGridData();
	this.wallGrid.transform(p_transformation, p_xDatum, p_yDatum);
	this.xLength = this.wallGrid.getXLength();
	this.yLength = this.wallGrid.getYLength();
	for (const id in this.grids) {
		this.grids[id].transform(p_transformation, p_xDatum, p_yDatum);
	}
	this.resetSelection();
}

//-------------------------------------------
// Chain insertion

const INPUT_PLACE_KIND = {
	GRID : 0,
	MARGIN : 1
}

EditorCore.prototype.insertChainGrid = function(p_gridId, p_valuesChain, p_validityMethod, p_parameters, p_x, p_y) {
	this.insertChainPrivate(INPUT_PLACE_KIND.GRID, p_gridId, p_valuesChain, p_validityMethod, p_parameters, p_x, p_y, this.getXLength(), -1);
}

EditorCore.prototype.insertChainMargin = function(p_edge, p_valuesChain, p_validityMethod, p_parameters, p_index) {
	const appropriateLength = ((p_edge == EDGES.LEFT || p_edge == EDGES.RIGHT) ? this.getYLength() : this.getXLength());
	this.insertChainPrivate(INPUT_PLACE_KIND.MARGIN, p_edge, p_valuesChain, p_validityMethod, p_parameters, p_index, -1, appropriateLength, -1);
}

// See below for p_destinationKind" and p_destinationNomination
// Also, p_x, p_y are coordinates if we use grid, but not otherwise ! p_length1, p_length2 are supposed to be the size of the desired array so... grid or margin
EditorCore.prototype.insertChainPrivate = function(p_destinationKind, p_destinationNomination, p_valuesChain, p_validityMethod, p_parameters, p_x, p_y, p_length1, p_length2) {
	// Blank character and monocharacter
	if (p_valuesChain != null) {
		var tokens;
		var tokensNumber;
		if (p_parameters.isMonoChar) {
			tokensNumber = p_valuesChain.length;
		} else {
			tokens = p_valuesChain.split(" ");
			tokensNumber = tokens.length;
		}
		var x = p_x;
		var indexToken = 0;
		while (x < p_length1 && indexToken < tokensNumber) {
			value = (p_parameters.isMonoChar ? p_valuesChain.charAt(indexToken) : tokens[indexToken]);
			var ok = false;
			if (p_validityMethod(value)) {
				var realValue = (value != "" ? value : null);
				realValue = (p_parameters.isNumeric && realValue != null) ? parseInt(realValue, 10) : realValue;
				this.setAppropriatePlace(p_destinationKind, p_destinationNomination, x, p_y, realValue);
				ok = true;
			}
			if (!p_parameters.isMonoChar && (value.charAt(0) == p_parameters.emptySpaceChar)) {
				this.setAppropriatePlace(p_destinationKind, p_destinationNomination, x, p_y, null);
				var indexClue = 1;
				while((indexClue < value.length) && (value.charAt(indexClue) == p_parameters.emptySpaceChar) && (x <= p_length1-2)) {
					x++;
					this.setAppropriatePlace(p_destinationKind, p_destinationNomination, x, p_y, null);
					indexClue++;
				}
				ok = (indexClue == value.length);
			}
			if (p_parameters.isMonoChar && (value == p_parameters.emptySpaceChar)) {
				this.setAppropriatePlace(p_destinationKind, p_destinationNomination, x, p_y, null);
				ok = true;
			}
			if (!ok) {
				break;
			}
			if (value != "") {
				x++;
			}
			indexToken++;
		}
		if ((tokensNumber == 1) && ok) { // If only one symbol, save it
			this.setPromptValue(value);
		}
	}
}

// Put value into place (space, margin, or whatever...). Role of "destination nomination" is given here.
EditorCore.prototype.setAppropriatePlace = function (p_destinationKind, p_destinationNomination, p_x, p_y, p_val) {
	switch(p_destinationKind) {
		case INPUT_PLACE_KIND.GRID :  // p_destinationNomination = id of the grid
			this.set(p_destinationNomination, p_x, p_y, p_val);
		break;
		case INPUT_PLACE_KIND.MARGIN :  // p_destinationNomination = EDGES.LEFT, UP, RIGHT, DOWN. Only the first coordinate matters. 
			this.setMarginEntry(p_destinationNomination, p_x, p_val);
		break;
	}
}

//-------------------------------------------
// Selections 

EditorCore.prototype.switchSelectedSpace = function (p_x, p_y) {
    if (this.selectedArray[p_y][p_x] == SELECTED.YES){
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
			for (var ix = xMin; ix <= xMax; ix++) {
				for (var iy = yMin; iy <= yMax; iy++) {
					this.selectedArray[iy][ix] = SELECTED.YES;
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
                if (x > 0 && this.selectedArray[y][x - 1] == SELECTED.NO) {
                    this.wallGrid.setWallR(x - 1, y, WALLGRID.CLOSED);
                }
                if (x < this.getXLength() - 1 && this.selectedArray[y][x + 1] == SELECTED.NO) {
                    this.wallGrid.setWallR(x, y, WALLGRID.CLOSED);
                }
                if (y > 0 && this.selectedArray[y - 1][x] == SELECTED.NO) {
                    this.wallGrid.setWallD(x, y - 1, WALLGRID.CLOSED);
                }
                if (y < this.getYLength() - 1 && this.selectedArray[y + 1][x] == SELECTED.NO) {
                    this.wallGrid.setWallD(x, y, WALLGRID.CLOSED);
                }
            }
        }
    }
    this.unselectAll();
}

EditorCore.prototype.clearWallsAround = function (p_x, p_y) {
    if (p_x > 0 && this.selectedArray[p_y][p_x - 1] == SELECTED.NO) {
        this.wallGrid.setWallR(p_x - 1, p_y, WALLGRID.OPEN);
    }
    if (p_x < this.getXLength() - 1 && this.selectedArray[p_y][p_x + 1] == SELECTED.NO) {
        this.wallGrid.setWallR(p_x, p_y, WALLGRID.OPEN);
    }
    if (p_y > 0 && this.selectedArray[p_y - 1][p_x] == SELECTED.NO) {
        this.wallGrid.setWallD(p_x, p_y - 1, WALLGRID.OPEN);
    }
    if (p_y < this.getYLength() - 1 && this.selectedArray[p_y + 1][p_x] == SELECTED.NO) {
        this.wallGrid.setWallD(p_x, p_y, WALLGRID.OPEN);
    }
}

EditorCore.prototype.countSpacesSelection = function() {
	var answer = 0;
	for (var y = 0; y < this.getYLength(); y++) {
        for (var x = 0; x < this.getXLength(); x++) {
			if (this.selectedArray[y][x] == SELECTED.YES) {
				answer ++;
			}
		}
	}
	return answer;
}

EditorCore.prototype.moveCopySelection = function(p_deltaX, p_deltaY, p_move) {
	const progressX = p_deltaX >= 0 ? -1 : 1;
	const startX = p_deltaX >= 0 ? this.getXLength()-1 : 0;
	const overEndX = p_deltaX >= 0 ? -1 : this.getXLength();
	const progressY = p_deltaY >= 0 ? -1 : 1;
	const startY = p_deltaY >= 0 ? this.getYLength()-1 : 0;
	const overEndY = p_deltaY >= 0 ? -1 : this.getYLength();
	for (var y = startY ; y != overEndY ; y += progressY) {
		for (var x = startX ; x != overEndX ; x += progressX) {
			this.moveCopySpace(x, y, p_deltaX, p_deltaY, p_move);
		}
	}
}

EditorCore.prototype.moveCopySpace = function(p_x, p_y, p_deltaX, p_deltaY, p_move) {
	const xDest = p_x + p_deltaX;
	const yDest = p_y + p_deltaY;
	if (this.selectedArray[p_y][p_x]) { 
		this.selectedArray[p_y][p_x] = false;
		if ((xDest < 0) || (xDest >= this.getXLength()) || (yDest < 0) || (yDest >= this.getYLength())) {
			if (p_move) {
				Object.keys(GRID_ID).forEach(id => {
					if (this.visibleGrids[GRID_ID[id]]) {
						this.set(GRID_ID[id], p_x, p_y, null);
					}
				});
				if (this.isWithWalls) {
					this.setWallR(p_x, p_y, WALLGRID.OPEN);
					this.setWallD(p_x, p_y, WALLGRID.OPEN);
					this.setState(p_x, p_y, WALLGRID.OPEN);
				}
			}
		} else {
			this.selectedArray[yDest][xDest] = true;
			Object.keys(GRID_ID).forEach(id => {
				if (this.grids[GRID_ID[id]] && (this.get(GRID_ID[id], p_x, p_y) != null)) {
					this.set(GRID_ID[id], xDest, yDest, this.get(GRID_ID[id], p_x, p_y));
					if (p_move) {
						this.set(GRID_ID[id], p_x, p_y, null);
					}
				}
			});
			if (this.isWithWalls) {
				this.setWallR(xDest, yDest, this.getWallR(p_x, p_y));
				this.setWallD(xDest, yDest, this.getWallD(p_x, p_y));
				this.setState(xDest, yDest, this.getState(p_x, p_y));
				if (p_move) {
					this.setWallR(p_x, p_y, WALLGRID.OPEN);
					this.setWallD(p_x, p_y, WALLGRID.OPEN);
					this.setState(p_x, p_y, WALLGRID.OPEN);
				}
			}
		}
	}
}

//-------------------------------------------
// Misc.

EditorCore.prototype.alignToRegions = function (p_idGrid) {
    this.grids[p_idGrid].arrangeSymbols(this.wallGrid.toRegionGrid());
}

EditorCore.prototype.cleanRedundantWalls = function () { // Note : name transfer...
    this.wallGrid.cleanRedundantWalls();
}

