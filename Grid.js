function Grid(p_array, p_xLength, p_yLength) {
    this.array = p_array;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

function generateSymbolArray(p_widthGrid, p_heightGrid) {
    var answer = [];
    for (var iy = 0; iy < p_heightGrid; iy++) {
        answer.push([]);
        for (var ix = 0; ix < p_widthGrid; ix++) {
            answer[iy].push(null);
        }
    }
    return answer;
}

/*
Aligns symbols according to a region grid in a way that exactly one symbol is contained in each region that has one.
Preconditions :
-The region grid MUST be standardized (in reading order of first space in reading order of regions.)
-There shouldn't be more than one symbol in each region. Some regions may contain 0 such symbol.
Post condition :
-Each region contains either zero symbol or one, and that symbol is in the upper and then lefter space of the region.
 */
Grid.prototype.arrangeSymbols = function (p_regionGrid) {	
    var firstSpacesX = [];
    var firstSpacesY = [];
    var ir,
    firstX,
    firstY;
    for (var iy = 0; iy < this.yLength; iy++) {
        for (var ix = 0; ix < this.xLength; ix++) {
            ir = p_regionGrid[iy][ix];
            if (ir == firstSpacesX.length) {
                firstSpacesX.push(ix);
                firstSpacesY.push(iy);
            }
            if (this.array[iy][ix] != null) {
                firstX = firstSpacesX[ir];
                firstY = firstSpacesY[ir];
                if (firstX != ix || firstY != iy) {
                    this.array[firstY][firstX] = this.array[iy][ix];
                    this.array[iy][ix] = null;
                }
            }
        }
    }
}

Grid.prototype.get = function (p_x, p_y) {
    return this.array[p_y][p_x]
}

Grid.prototype.set = function (p_x, p_y, p_value) {	
    this.array[p_y][p_x] = p_value
}

Grid.prototype.clear = function (p_x, p_y) {
    this.array[p_y][p_x] = null
}

Grid.prototype.transform = function(p_transformation, p_xDatum, p_yDatum) {
	switch (p_transformation) {
		case GRID_TRANSFORMATION.ROTATE_CW : this.rotateCWGrid(); break;
		case GRID_TRANSFORMATION.ROTATE_CCW : this.rotateCCWGrid(); break;
		case GRID_TRANSFORMATION.ROTATE_UTURN : this.rotateUTurnGrid(); break;
		case GRID_TRANSFORMATION.MIRROR_HORIZONTAL : this.mirrorHorizontalGrid(); break;
		case GRID_TRANSFORMATION.MIRROR_VERTICAL : this.mirrorVerticalGrid(); break;
		case GRID_TRANSFORMATION.RESIZE : this.resizeGrid(p_xDatum, p_yDatum); break;
	}
}


Grid.prototype.rotateCWGrid = function () {
    var newArray = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.xLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
            newArray[iy].push(this.get(iy, this.yLength - 1 - ix));
        }
    }
    this.array = newArray;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}

Grid.prototype.rotateUTurnGrid = function () {
    var newArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            newArray[iy].push(this.get(this.xLength - 1 - ix, this.yLength - 1 - iy));
        }
    }
    this.array = newArray;
}

Grid.prototype.rotateCCWGrid = function () {
    var newArray = [];
    for (var iy = 0; iy < this.xLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
            newArray[iy].push(this.get(this.xLength - 1 - iy, ix));
        }
    }
    this.array = newArray;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}

Grid.prototype.mirrorHorizontalGrid = function () {
    var newArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            newArray[iy].push(this.get(this.xLength - 1 - ix, iy));
        }
    }
    this.array = newArray;
}

Grid.prototype.mirrorVerticalGrid = function () {
    var newArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            newArray[iy].push(this.get(ix, this.yLength - 1 - iy));
        }
    }
    this.array = newArray;
}

Grid.prototype.resizeGrid = function (p_xLength, p_yLength) {
    var newArray = [];
    var value;
    for (var iy = 0; iy < p_yLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < p_xLength; ix++) {
            if (ix < this.xLength && iy < this.yLength) {
                value = this.get(ix, iy);
            } else {
                value = null;
            }
            newArray[iy].push(value);
        }
    }
    this.array = newArray;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

//---------------------
// Saving from and loading to array

/**
New version : 
.O.O..X...
.X...O..O.
.....X....
..O.......
<=>
OX 1 3 | 5 8 | | 2 | 6 | 1 | 5 | |
(nb : "|" between 2 and 6 marks the separation between two arrays since it is the 4th, and the row count is 4.
*/
function arrayToStringRows(p_array,p_value) {
    xLength = p_array[0].length;
    yLength = p_array.length;
    var chain = "";
    for (var iy = 0; iy < yLength; iy++) {
        for (var ix = 0; ix < xLength; ix++) {
            if (p_array[iy][ix] == p_value) {
                chain += (ix + " ");
            }
        }
		chain += "| ";
    }
    return chain;
}

/**
Old version : 
.O.O......
.....O..O.
..........
..O.......
<=> 
1 0 O 3 0 O 5 1 O 8 1 O 3 2 O
*/
function arrayToStringSpaces(p_array) {
    xLength = p_array[0].length;
    yLength = p_array.length;
    var chain = "";
    for (var iy = 0; iy < yLength; iy++) {
        for (var ix = 0; ix < xLength; ix++) {
            if (p_array[iy][ix] != null) {
                chain += (ix + " " + iy + " " + p_array[iy][ix] + " ");
            }
        }
    }
    return chain;
}

function fillArrayWithTokensRows(p_tokens, p_array, p_indexToken, p_symbol) {
	var y = 0;
	while (y < p_array.length) {
		if (p_tokens[p_indexToken] == '') {
			p_indexToken++;
		}
		if (p_tokens[p_indexToken] == '|') {
			y++;
		} else {
			p_array[y][parseInt(p_tokens[p_indexToken], 10)] = p_symbol;
		}
		p_indexToken++;
	}
	return {newArray : p_array, newIndexToken : p_indexToken};
}

function fillArrayWithTokensSpaces(p_tokens,p_array){
    var indexToken = 0;
    while (indexToken < p_tokens.length - 2) {
        p_array[parseInt(p_tokens[indexToken + 1], 10)]
        [parseInt(p_tokens[indexToken], 10)] = parseInt(p_tokens[indexToken + 2], 10);
        indexToken += 3;
    }
    return p_array;
}  