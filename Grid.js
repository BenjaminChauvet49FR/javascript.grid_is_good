function Grid(p_array, p_xLength, p_yLength) {
    this.array = p_array;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

function Grid_dim(p_xLength, p_yLength) {
	return new Grid(generateSymbolArray(p_xLength, p_yLength), p_xLength, p_yLength);
}

function Grid_data(p_array) {
	if ((!p_array) || (!p_array.length)) {
		return null;
	}
	return new Grid(p_array, p_array[0].length, p_array.length);
}

/**
Generates a clean grid that is supposed to contain things into spaces. 
Even though the method is named "SymbolArray" it is generic and can contain anything that is contained directly into spaces. For instance, numbers.
*/
function generateSymbolArray(p_widthGrid, p_heightGrid) {
	return generateValueArray(p_widthGrid, p_heightGrid, null);
}

function generateValueArray(p_widthGrid, p_heightGrid, p_value) {
	var answer = [];
    for (var iy = 0; iy < p_heightGrid; iy++) {
        answer.push([]);
        for (var ix = 0; ix < p_widthGrid; ix++) {
            answer[iy].push(p_value);
        }
    }
    return answer;
}


function generateFunctionValueArray(p_widthGrid, p_heightGrid, p_function) {
	var answer = [];
    for (var iy = 0 ; iy < p_heightGrid; iy++) {
        answer.push([]);
        for (var ix = 0 ; ix < p_widthGrid ; ix++) {
            answer[iy].push(p_function(ix, iy));
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

Grid.prototype.getXLength = function() {
	return this.xLength;
}

Grid.prototype.getYLength = function() {
	return this.yLength;
}

Grid.prototype.transform = function(p_transformation, p_xDatum, p_yDatum, p_orientedSpaces) {
	switch (p_transformation) {
		case GRID_TRANSFORMATION.ROTATE_CW : this.rotateCWGrid(p_orientedSpaces); break;
		case GRID_TRANSFORMATION.ROTATE_CCW : this.rotateCCWGrid(p_orientedSpaces); break;
		case GRID_TRANSFORMATION.ROTATE_UTURN : this.rotateUTurnGrid(p_orientedSpaces); break;
		case GRID_TRANSFORMATION.MIRROR_HORIZONTAL : this.mirrorHorizontalGrid(p_orientedSpaces); break;
		case GRID_TRANSFORMATION.MIRROR_VERTICAL : this.mirrorVerticalGrid(p_orientedSpaces); break;
		case GRID_TRANSFORMATION.RESIZE : this.resizeGrid(p_xDatum, p_yDatum); break;
	}
}

Grid.prototype.rotateCWGrid = function (p_orientedSpaces) {
    var newArray = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.xLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
			const value = this.get(iy, this.yLength - 1 - ix);
            newArray[iy].push(p_orientedSpaces ? rotateCWString(value) : value);
        }
    }
    this.array = newArray;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}

Grid.prototype.rotateUTurnGrid = function (p_orientedSpaces) {
    var newArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
			const value = this.get(this.xLength - 1 - ix, this.yLength - 1 - iy);
            newArray[iy].push(p_orientedSpaces ? rotateUTurnString(value) : value);
        }
    }
    this.array = newArray;
}

Grid.prototype.rotateCCWGrid = function (p_orientedSpaces) {
    var newArray = [];
    for (var iy = 0; iy < this.xLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
			const value = this.get(this.xLength - 1 - iy, ix);
            newArray[iy].push(p_orientedSpaces ? rotateCCWString(value) : value);
        }
    }
    this.array = newArray;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}

Grid.prototype.mirrorHorizontalGrid = function (p_orientedSpaces) {
    var newArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
			const value = this.get(this.xLength - 1 - ix, iy)
            newArray[iy].push(p_orientedSpaces ? mirrorHorizontalString(value) : value);
        }
    }
    this.array = newArray;
}

Grid.prototype.mirrorVerticalGrid = function (p_orientedSpaces) {
    var newArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
			const value = this.get(ix, this.yLength - 1 - iy);
            newArray[iy].push(p_orientedSpaces ? mirrorVerticalString(value) : value);
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

// Now, local transformations !
Grid.prototype.transformLocal = function(p_transformation, p_coorsList, p_xMid, p_yMid, p_orientedSpaces) {
	var newList;
	switch (p_transformation) {
		case GRID_TRANSFORMATION.ROTATE_CW : newList = this.listSpacesRotateCW(p_coorsList, p_xMid, p_yMid, p_orientedSpaces); break;
		case GRID_TRANSFORMATION.ROTATE_CCW : newList = this.listSpacesRotateCCW(p_coorsList, p_xMid, p_yMid, p_orientedSpaces); break;
		case GRID_TRANSFORMATION.ROTATE_UTURN : newList = this.listSpacesRotateUturn(p_coorsList, p_xMid, p_yMid, p_orientedSpaces); break;
		case GRID_TRANSFORMATION.MIRROR_HORIZONTAL : newList = this.listSpacesMirrorHorizontal(p_coorsList, p_xMid, p_orientedSpaces); break;
		case GRID_TRANSFORMATION.MIRROR_VERTICAL : newList = this.listSpacesMirrorVertical(p_coorsList, p_yMid, p_orientedSpaces); break;
	}
	p_coorsList.forEach(coors => {
		this.array[coors.y][coors.x] = null;
	});
	newList.forEach(coorsVal => {
		this.array[coorsVal.y][coorsVal.x] = coorsVal.value;
	});
}

Grid.prototype.listSpacesRotateCW = function(p_coors, p_xMiddle, p_yMiddle, p_isOriented) {
	var newList = [];
	var x, y, val;
	p_coors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		val = p_isOriented ? rotateCWString(this.array[y][x]) : this.array[y][x];
		newList.push({x : p_xMiddle - (y - p_yMiddle), y : p_yMiddle + (x - p_xMiddle), value : val}); // Superfluous parentheses but it makes reading easier
	});
	return newList
}

Grid.prototype.listSpacesRotateCCW = function(p_coors, p_xMiddle, p_yMiddle, p_isOriented) {
	var newList = [];
	var x, y, val;
	p_coors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		val = p_isOriented ? rotateCWString(this.array[y][x]) : this.array[y][x];
		newList.push({x : p_xMiddle + (y - p_yMiddle), y : p_yMiddle - (x - p_xMiddle), value : val}); // Superfluous parentheses but it makes reading easier
	});
	return newList
}

Grid.prototype.listSpacesRotateUturn = function(p_coors, p_xMiddle, p_yMiddle, p_isOriented) {
	var newList = [];
	var x, y, val;
	p_coors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		val = p_isOriented ? rotateUTurnString(this.array[y][x]) : this.array[y][x];
		newList.push({x : p_xMiddle*2-x, y : p_yMiddle*2-y, value : val});
	});
	return newList
}

Grid.prototype.listSpacesMirrorHorizontal = function(p_coors, p_xMiddle, p_isOriented) {
	var newList = [];
	var x, y, val;
	p_coors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		val = p_isOriented ? mirrorHorizontalString(this.array[y][x]) : this.array[y][x];
		newList.push({x : p_xMiddle*2-x, y : y, value : val});
	});
	return newList
}

Grid.prototype.listSpacesMirrorVertical = function(p_coors, p_yMiddle, p_isOriented) {
	var newList = [];
	var x, y, val;
	p_coors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		val = p_isOriented ? mirrorVerticalString(this.array[y][x]) : this.array[y][x];
		newList.push({x : x, y : p_yMiddle*2-y, value : val});
	});
	return newList
}

// Important to symbolize the directions. Not linked to the main 'directions' since it is for pure array representation.
// Directions in strings MUST BE 'L' 'U' 'R' 'D' ; strings MUST NOT CONTAIN '%'

function replacementCycle(p_string, p_array) {
	if (p_string == null) {
		return null;
	}
	var answer = p_string.replace(p_array[p_array.length-1], "%");
	for (var i = p_array.length-2 ; i >= 0 ; i--) {
		answer = answer.replace(p_array[i], p_array[i+1]);
	}
	return answer.replace("%", p_array[0]);
}

function rotateCWString(p_string) {
	return replacementCycle(p_string, ["L", "U", "R", "D"]);
}

function rotateCCWString(p_string) {
	return replacementCycle(p_string, ["L", "D", "R", "U"]);
}

function mirrorHorizontalString(p_string) {
	return replacementCycle(p_string, ["L", "R"]);
}

function mirrorVerticalString(p_string) {
	return replacementCycle(p_string, ["U", "D"]);
}

function rotateUTurnString(p_string) {
	return mirrorHorizontalString(mirrorVerticalString(p_string));
}

//---------------------
// Saving from and loading to array

//Saver and loader by written spaces
/**
Old version : 
.O.O......
.....O..O.
..........
..O.......
<=> 
1 0 O 3 0 O 5 1 O 8 1 O 3 2 O
Can give coordinates if "p_dealCoordinates" is set to true
*/
function arrayToStringSpaces(p_array, p_dealCoordinates) {
    xLength = p_array[0].length;
    yLength = p_array.length;
    var answer = (p_dealCoordinates ? xLength + " " + yLength + " " : "");
    for (var iy = 0; iy < yLength; iy++) {
        for (var ix = 0; ix < xLength; ix++) {
            if (p_array[iy][ix] != null) {
                answer += (ix + " " + iy + " " + p_array[iy][ix] + " ");
            }
        }
    }
    return answer;
}

/*
Directly fills an array with tokens.
(p_array must be provided. And dimensions must be known.)
*/
function fillArrayWithTokensSpaces(p_tokens, p_array){
    var indexToken = 0;
    while (indexToken < p_tokens.length - 2) {
        p_array[parseInt(p_tokens[indexToken + 1], 10)]
        [parseInt(p_tokens[indexToken], 10)] = parseInt(p_tokens[indexToken + 2], 10);
        indexToken += 3;
    }
    return p_array;
}  

// Saver and loader by written rows

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
Fills arrays with tokens by rows. Only stops when <number of rows> separator symbols ('|') have been read.
p_tokens : list of tokens (resulting from a string split by ' ' for instance)
p_array : array to fill (must be provided. And dimensions must be known.)
p_indexToken : next index to be read
p_symbol : symbol to put into spaces
newArray and newIndexToken are the states of p_array and p_indexToken after applying this method.
Example : a set of parameters ("5 5 WB | | 3 | | | 1 3 | | | 1 3 | |" , [array 5x5], 3, W) will put W symbols until having met the 5th | (here, in space [2][3] (y first) )
and upgrade the grid as such and the index (initially 3) into newArray and newIndexToken)
*/
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

/**
Inspired by puzzleRegionIndicationsToString in commonSaveAndLoad (that calls this function). This time, it is about saving data in spaces in lexical order. In the long run, this could replace the classical save/load methods.
E.g. let's have a 5x5 grid : 
..A..
.B..C
.D.E.
FGH..
It is saved this way : ' XX A X3 B X3 C X D X E X F G H'
A mix of a lot of different values are possible
Space at start of string !
*/
function lexicalSpacesValuesToString(p_valuesArray) {
	var answer = "";
	var skippedSpaces = 0;
	var value;
	for(var iy = 0 ; iy < p_valuesArray.length ; iy++) {
		for(var ix = 0 ; ix < p_valuesArray[0].length; ix++) {
			value = p_valuesArray[iy][ix];
			if (value != null) {
				if (skippedSpaces == 1) {
					answer += " X";
				} else if (skippedSpaces == 2) {
					answer += " XX";
				} else if (skippedSpaces >= 3) {
					answer += " X"+skippedSpaces;
				}
				answer += " " + ((typeof(value) == "string" && value.charAt(0) == 'X') ? ('x' + value) : value); // No parentheses to circle the whole ternary (from "(typeof"  to ": value)" ) = small cap Xs everywhere.
				skippedSpaces = 0;
			} else {
				skippedSpaces++;
			}
		}
	}
	return answer;
}