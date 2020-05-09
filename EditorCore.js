const GRID_ID = {
    NUMBER_REGION: 'NR',
    PEARL: 'P'
}
const SYMBOL_ID = {
    WHITE: "W",
    BLACK: 'B'
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
    this.possessPathGrid = (p_parameters && (p_parameters.hasPathGrid == true)); //TODO il y a mieux qu'une gestion de booléens j'imagine
    this.possessWallGrid = !this.possessPathGrid;
    this.startGrid(p_xLength, p_yLength);
    this.isWithWalls = (!p_parameters || !p_parameters.hasWalls || (p_parameters.hasWalls != false));
}

//TODO : en l'état actuel on a une grille "wallGrid" et une grille "pathGrid"... qui ont exactement la même nature ! (WallGrid). Attention danger.
/**
Starts a grid from scratch.
Basically the same as restarting it.
 */
EditorCore.prototype.startGrid = function (p_xLength, p_yLength) {
    this.restartGrid(p_xLength, p_yLength);
}

/**
Restarts a grid from scratch.
 */
EditorCore.prototype.restartGrid = function (p_xLength, p_yLength) {
	if (this.hasPathGrid()) {
        this.pathGrid = new WallGrid(generatePathArray(p_xLength,p_yLength), p_xLength, p_yLength); //TODO très laid
    }
    if (this.hasWallGrid()) {
        this.wallGrid = new WallGrid(generateWallArray(p_xLength,p_yLength), p_xLength, p_yLength);
    }
	this.grids = {};
	this.reinitializeGridData();
}

// NB : fonction de convénience.
EditorCore.prototype.reinitializeGridData = function() {
	this.regionGrid = null;
    this.isRegionGridValid = true;
    this.isSelectionMode = false;
    this.selectedCornerSpace = null;
    this.selectedGrid = null;
    this.inputNumber = 1;
	this.inputSymbol = null;
	this.resetSelection();
	this.mode = {
        colorRegionIfValid: false
    };
}

//Set up from non null grids
/**
Performs the required set up from a wall array (a blank one, one that was just modified or a loaded one)
This required setup may include region grid, selection mode...
 */
EditorCore.prototype.setupFromWallArray = function (p_wallArray) {
	this.restartGrid(p_wallArray[0].length, p_wallArray.length);
    this.wallGrid = new WallGrid(p_wallArray, p_wallArray[0].length, p_wallArray.length);
}

/**
Same as setupFromWallArray but with a path grid
 */
EditorCore.prototype.setupFromPathArray = function (p_pathArray) {
    this.pathGrid = new WallGrid(p_pathArray, p_pathArray[0].length, p_pathArray.length);
}

EditorCore.prototype.addCleanGrid = function (p_id,p_xLength,p_yLength) {
    this.grids[p_id] = new Grid(generateSymbolArray(p_xLength,p_yLength),p_xLength,p_yLength);
}

EditorCore.prototype.addGrid = function (p_id,p_array) {
	if (p_array != null && p_array.length > 0) {
	    this.grids[p_id] = new Grid(p_array, p_array[0].length, p_array.length);
	}
}

// ----------
// Testers

EditorCore.prototype.hasPathGrid = function () {
    return this.possessPathGrid;
}

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

EditorCore.prototype.getSelection = function (p_x, p_y) {
    return this.selectedGrid[p_y][p_x];
}

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
EditorCore.prototype.getPathR = function (p_x, p_y) {
    return this.pathGrid.getWallR(p_x, p_y);
}
EditorCore.prototype.getPathD = function (p_x, p_y) {
    return this.pathGrid.getWallD(p_x, p_y);
}
EditorCore.prototype.setPathR = function (p_x, p_y, p_state) {
    this.pathGrid.setWallR(p_x, p_y);
}
EditorCore.prototype.setPathD = function (p_x, p_y, p_state) {
    this.pathGrid.setWallD(p_x, p_y);
}
EditorCore.prototype.switchPathR = function (p_x, p_y) {
    this.pathGrid.switchWallR(p_x, p_y);
}
EditorCore.prototype.switchPathD = function (p_x, p_y) {
    this.pathGrid.switchWallD(p_x, p_y);
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
    if (this.hasWallGrid()) {
        return this.wallGrid.xLength;
    }
    if (this.hasPathGrid()) {
        return this.pathGrid.xLength;
    }
}
EditorCore.prototype.getYLength = function () {
    if (this.hasWallGrid()) {
        return this.wallGrid.yLength;
    }
    if (this.hasPathGrid()) {
        return this.pathGrid.yLength;
    }
}

// --------------------
// Non-wall stuff
EditorCore.prototype.setWallsOn = function () {
    this.isWithWalls = true;
}

EditorCore.prototype.setWallsOff = function () {
    this.isWithWalls = false;
}

EditorCore.prototype.hasWalls = function () {
    return this.isWithWalls == true;
}

// --------------------
// Grid transformations


EditorCore.prototype.transformGrid = function (p_transformation, p_xDatum, p_yDatum) {
	this.reinitializeGridData();
    if (this.hasWallGrid()) {
        this.wallGrid.transform(p_transformation, p_xDatum, p_yDatum);
    }
    if (this.hasPathGrid()) {
        this.pathGrid.transform(p_transformation, p_xDatum, p_yDatum);
    }
	for (const id in this.grids) {
	    this.grids[id].transform(p_transformation, p_xDatum, p_yDatum);
	}
	this.resetSelection();
}

//-------------------------------------------

/**
Selection phase
 */
EditorCore.prototype.switchSelectedSpace = function (p_x, p_y) {
    if (this.selectedGrid[p_y][p_x] == SELECTED.YES){
		this.selectedGrid[p_y][p_x] = SELECTED.NO;
		return;
	}
	this.selectedGrid[p_y][p_x] = SELECTED.YES;
}

EditorCore.prototype.selectRectangleMechanism = function (p_x, p_y) {
    if (this.selectedCornerSpace == null) {
        this.selectedCornerSpace = {
            x: p_x,
            y: p_y
        };
    } else {
        const xMin = Math.min(this.selectedCornerSpace.x, p_x);
        const yMin = Math.min(this.selectedCornerSpace.y, p_y);
        const xMax = Math.max(this.selectedCornerSpace.x, p_x);
        const yMax = Math.max(this.selectedCornerSpace.y, p_y);
        for (x = xMin; x <= xMax; x++) {
            for (var y = yMin; y <= yMax; y++) {
                this.selectedGrid[p_y][p_x] = SELECTED.YES;
            }
        }
        this.selectedCornerSpace = null;
    }
}

EditorCore.prototype.unselectAll = function () {
    for (var iy = 0; iy < this.getYLength(); iy++) {
        for (var ix = 0; ix < this.getXLength(); ix++) {
            this.selectedGrid[iy][ix] = SELECTED.NO;
        }
    }
    this.selectedCornerSpace = null;
}

EditorCore.prototype.resetSelection = function () {
    this.isSelectionMode = false;
    this.selectedGrid = [];
    for (var iy = 0; iy < this.getYLength(); iy++) {
        this.selectedGrid.push([]);
        for (var ix = 0; ix < this.getXLength(); ix++) {
            this.selectedGrid[iy].push(SELECTED.NO);
        }
    }
    this.selectedCornerSpace = null;
}

EditorCore.prototype.buildWallsAroundSelection = function () {
    for (var y = 0; y < this.getYLength(); y++) {
        for (var x = 0; x < this.getXLength(); x++) {
            if (this.selectedGrid[y][x] == SELECTED.YES) {
                if (x > 0 && this.selectedGrid[y][x - 1] == SELECTED.NO) {
                    this.wallGrid.setWallR(x - 1, y, WALLGRID.CLOSED);
                }
                if (x < this.getXLength() - 1 && this.selectedGrid[y][x + 1] == SELECTED.NO) {
                    this.wallGrid.setWallR(x, y, WALLGRID.CLOSED);
                }
                if (y > 0 && this.selectedGrid[y - 1][x] == SELECTED.NO) {
                    this.wallGrid.setWallD(x, y - 1, WALLGRID.CLOSED);
                }
                if (y < this.getYLength() - 1 && this.selectedGrid[y + 1][x] == SELECTED.NO) {
                    this.wallGrid.setWallD(x, y, WALLGRID.CLOSED);
                }
            }
        }
    }
    this.unselectAll();
}

EditorCore.prototype.clearWallsAround = function (p_x, p_y) {
    if (p_x > 0 && this.selectedGrid[p_y][p_x - 1] == SELECTED.NO) {
        this.wallGrid.setWallR(p_x - 1, p_y, OPEN);
    }
    if (p_x < this.getXLength() - 1 && this.selectedGrid[p_y][p_x + 1] == SELECTED.NO) {
        this.wallGrid.setWallR(p_x, p_y, OPEN);
    }
    if (p_y > 0 && this.selectedGrid[p_y - 1][p_x] == SELECTED.NO) {
        this.wallGrid.setWallD(p_x, p_y - 1, OPEN);
    }
    if (p_y < this.getYLength() - 1 && this.selectedGrid[p_y + 1][p_x] == SELECTED.NO) {
        this.wallGrid.setWallD(p_x, p_y, OPEN);
    }
}

EditorCore.prototype.alignToRegions = function (p_idGrid) {
    this.grids[p_idGrid].arrangeSymbols(this.wallGrid.toRegionGrid());
}

