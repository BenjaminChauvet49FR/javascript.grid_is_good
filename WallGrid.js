// Constants for walls and spaces
const UNCHARTED = -1; // Only used in this file and therefore not bound to "WALLGRID"
const WALLGRID = {OPEN : 0, CLOSED : 1, OUT_OF_REGIONS : -2}

function switchedState(p_state) {
    return 1 - p_state;
}

// ---------------------------------------------
// Creator and generations

function WallGrid(p_wallArray, p_xLength, p_yLength) {
    this.array = p_wallArray;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

function WallGrid_dim(p_xLength, p_yLength) {
    return new WallGrid(generateSuggestedArray(p_xLength, p_yLength, WALLGRID.OPEN), p_xLength, p_yLength);
}

function WallGrid_dim_closed(p_xLength, p_yLength) {
    return new WallGrid(generateSuggestedArray(p_xLength, p_yLength, WALLGRID.CLOSED), p_xLength, p_yLength);
}

function WallGrid_data(p_array) {
	if (!p_array || !p_array.length) {
		return null;
	}
	else {
		return new WallGrid(p_array, p_array[0].length, p_array.length);		
	}
}

function generateWallArray(p_widthGrid, p_heightGrid) {
    return generateSuggestedArray(p_widthGrid, p_heightGrid, WALLGRID.OPEN);
}

function generateSuggestedArray(p_widthGrid, p_heightGrid, p_startingStateWalls) {
    var result = [];
    for (var iy = 0; iy < p_heightGrid; iy++) {
        result.push([]);
        for (var ix = 0; ix < p_widthGrid; ix++) {
            result[iy].push({
                state: WALLGRID.OPEN,
                wallD: p_startingStateWalls,
                wallR: p_startingStateWalls
            });
        }
    }
    return result;
}

/**
Removes walls next to banned spaces
*/
WallGrid.prototype.cleanRedundantWalls = function() {
	for (var iy = 0; iy < this.yLength ; iy++) {
		for (var ix = 0; ix < this.xLength ; ix++) {
			if (this.array[iy][ix].state == WALLGRID.CLOSED) {
				existingNeighborsDirections(ix, iy, this.xLength, this.yLength).forEach(dir => {
					if (this.getWall(ix, iy, dir) == WALLGRID.CLOSED) {
						this.setWall(ix, iy, dir, WALLGRID.OPEN);
					}
				});
			}
		}
	}
}

// --------------
// Regionalize !

/**
Converts a grid with walls (right and down) to a "region" grid (regions 1,2,3,...)
 */
WallGrid.prototype.toRegionArray = function () {
    var regionArray = [];
    //Create the grid with banned and uncharted spaces
    for (var iy = 0; iy < this.yLength; iy++) {
        regionArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            if (this.array[iy][ix].state == WALLGRID.CLOSED) {
                regionArray[iy].push(WALLGRID.OUT_OF_REGIONS);
            } else {
                regionArray[iy].push(UNCHARTED);
            }
        }
    }
    //Region parting :
    var firstX;
    var firstY = 0;
    var regionIndex = 0;
    var spacesThatBelong = [];
    var spaceToPut;
    var x, y;
	var firstSpaces = [];
    //Then, go for all non-banned spaces
    while (firstY < this.yLength) {
        firstX = 0;
        while ((firstX < this.xLength) && (regionArray[firstY][firstX] != UNCHARTED)) { //le dernier true sera à changer quand je ferai des cases destinées à rester à -1
            firstX++;
        }
        if (firstX < this.xLength) {
            spacesThatBelong.push({
                sx: firstX,
                sy: firstY
            });
            while (spacesThatBelong.length > 0) {
                spaceToPut = spacesThatBelong.pop();
                x = spaceToPut.sx;
                y = spaceToPut.sy;
                regionArray[y][x] = regionIndex;
				existingNeighborsCoorsDirections(x, y, this.xLength, this.yLength).forEach(coorsDir => {
					dx = coorsDir.x;
					dy = coorsDir.y;
					dir = coorsDir.direction;
					if (regionArray[dy][dx] == UNCHARTED && this.getWall(x, y, dir) == WALLGRID.OPEN) {
						spacesThatBelong.push({sx : dx, sy : dy});
					}
				});
            }
            regionIndex++;
            firstX++;
        }
        if (firstX == this.xLength) {
            firstX = 0;
            firstY++;
        }
    }
	return regionArray;
}

// Computes all spaces by region from the array of coordinates.
// It supposes that the array is standard
listSpacesByRegion = function(p_regionArray) {
	var spacesByRegion = [];
	var ir;
	for(iy = 0 ; iy < p_regionArray.length ; iy++) {
		for(ix = 0 ; ix < p_regionArray[iy].length ; ix++) {
			ir = p_regionArray[iy][ix];
			if(ir != WALLGRID.OUT_OF_REGIONS) {
				while (ir >= spacesByRegion.length) {
					spacesByRegion.push([]);
				}
				spacesByRegion[ir].push({x:ix,y:iy});
			}
		}
	}
	return spacesByRegion;
}

numberOfRegions = function(p_regionArray) {
	var firstCoors = [];
	var ix,iy;
	var lastRegionNumber = 0;
	for(iy = 0; iy < p_regionArray.length ; iy++){
		for(ix = 0; ix < p_regionArray[iy].length ; ix++){
			lastRegionNumber = Math.max(p_regionArray[iy][ix], lastRegionNumber);
		}
	}
	return lastRegionNumber + 1;
}

// Borders between regions. Returns an array of (p_numberRegions) arrays of lengths (0, 1, ..., p_numberRegions-1). 
// The first one is empty but hey, that's what it takes to force coordinates of y > x. 
// Each array contains coordinates and direction, necessarily right or down, of a border element.
getBordersTriangle = function(p_regionArray, p_numberRegions) {
	var triangleArray = [];
	
	var ir1, ir2
	for (ir1 = 0 ; ir1 < p_numberRegions ; ir1 ++) {
		triangleArray.push([]);
		for (ir2 = 0 ; ir2 < ir1 ; ir2 ++) {
			triangleArray[ir1].push([]);
		}
	}
	var ix, iy, dx, dy;
	for (iy = 0 ; iy < p_regionArray.length ; iy++) {
		for (ix = 0 ; ix < p_regionArray[iy].length ; ix++) {
			ir1 = p_regionArray[iy][ix];
			if (ir1 != WALLGRID.OUT_OF_REGIONS) {
				existingRDNeighborsCoorsDirections(ix, iy, p_regionArray[iy].length, p_regionArray.length).forEach(coorsDir => {
					ir2 = p_regionArray[coorsDir.y][coorsDir.x];
					if (ir2 != WALLGRID.OUT_OF_REGIONS) {
						ir3 = null;
						if (ir1 < ir2) {
							ir3 = ir2;
							ir2 = ir1;
						} else {
							ir3 = ir1;
						} // So ir3 != ir2
						if (ir3 != ir2) {
							triangleArray[ir3][ir2].push({x : ix, y : iy, direction : coorsDir.direction});
						}
					}
				});
			}
		}
	}
	return triangleArray;
}

//Returns the array of directions of adjacent spaces that are in different regions
getOtherRegionDirectionsArray = function(p_regionArray) {
	const xLength = p_regionArray[0].length;
	const yLength = p_regionArray.length;
	var answerArray = generateFunctionValueArray(xLength, yLength, function() {return []});
	var r1, r2;
	for (var iy = 0; iy < yLength ; iy++) {
		for (var ix = 0 ; ix < xLength ; ix++) {
			r1 = p_regionArray[iy][ix];
			if (r1 != WALLGRID.OUT_OF_REGIONS) {
				existingRDNeighborsCoorsDirections(ix, iy, xLength, yLength).forEach(coorsDir => {
					r2 = p_regionArray[coorsDir.y][coorsDir.x];
					if (r2 != WALLGRID.OUT_OF_REGIONS && r2 != r1) {
						answerArray[iy][ix].push(coorsDir.direction);
						answerArray[coorsDir.y][coorsDir.x].push(OppositeDirection[coorsDir.direction]);
					}
				});	
			}			
		}
	}
	return answerArray;
}


// --------------
// Generic getters and setters

WallGrid.prototype.getWallR = function (p_x, p_y) {
    return this.array[p_y][p_x].wallR;
}
WallGrid.prototype.getWallD = function (p_x, p_y) {
    return this.array[p_y][p_x].wallD;
}
WallGrid.prototype.getWallU = function (p_x, p_y) {
    return this.array[p_y - 1][p_x].wallD;
}
WallGrid.prototype.getWallL = function (p_x, p_y) {
    return this.array[p_y][p_x - 1].wallR;
}
WallGrid.prototype.getState = function (p_x, p_y) {
    return this.array[p_y][p_x].state;
}
WallGrid.prototype.setWallR = function (p_x, p_y, p_state) {
    this.array[p_y][p_x].wallR = p_state;
}
WallGrid.prototype.setWallD = function (p_x, p_y, p_state) {
    this.array[p_y][p_x].wallD = p_state;
}
WallGrid.prototype.setWallU = function (p_x, p_y, p_state) {
    this.array[p_y - 1][p_x].wallD = p_state;
}
WallGrid.prototype.setWallL = function (p_x, p_y, p_state) {
    this.array[p_y][p_x - 1].wallR = p_state;
}
WallGrid.prototype.setState = function (p_x, p_y, p_state) {
    this.array[p_y][p_x].state = p_state;
}
WallGrid.prototype.switchWallR = function (p_x, p_y) {
    this.setWallR(p_x, p_y, switchedState(this.getWallR(p_x, p_y)));
}
WallGrid.prototype.switchWallD = function (p_x, p_y) {
    this.setWallD(p_x, p_y, switchedState(this.getWallD(p_x, p_y)));
}
WallGrid.prototype.switchWallU = function (p_x, p_y) {
    this.setWallU(p_x, p_y, switchedState(this.getWallU(p_x, p_y)));
}
WallGrid.prototype.switchWallL = function (p_x, p_y) {
    this.setWallL(p_x, p_y, switchedState(this.getWallL(p_x, p_y)));
}
WallGrid.prototype.switchState = function (p_x, p_y) {
    this.setState(p_x, p_y, switchedState(this.getState(p_x, p_y)));
}
WallGrid.prototype.getWall = function(p_x, p_y, p_dir) {
	switch(p_dir) {
		case DIRECTION.LEFT : return this.getWallL(p_x, p_y); break;
		case DIRECTION.UP : return this.getWallU(p_x, p_y); break;
		case DIRECTION.RIGHT : return this.getWallR(p_x, p_y); break;
		default : return this.getWallD(p_x, p_y); break;
	}
}		
WallGrid.prototype.setWall = function(p_x, p_y, p_dir, p_state) {
	switch(p_dir) {
		case DIRECTION.LEFT : return this.setWallL(p_x, p_y, p_state); break;
		case DIRECTION.UP : return this.setWallU(p_x, p_y, p_state); break;
		case DIRECTION.RIGHT : return this.setWallR(p_x, p_y, p_state); break;
		default : return this.setWallD(p_x, p_y, p_state); break;
	}
}	


WallGrid.prototype.getXLength = function() {
	return this.xLength;
}
WallGrid.prototype.getYLength = function() {
	return this.yLength;
}

// --------------
// Transformations

WallGrid.prototype.rotateCWGrid = function () {
    var newWallGrid = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.xLength; iy++) {
        newWallGrid.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
            newWallD = this.getWallR(iy, this.yLength - 1 - ix);
            if (ix < this.yLength - 1)
                newWallR = this.getWallD(iy, this.yLength - 2 - ix);
            else
                newWallR = WALLGRID.CLOSED;
            newWallGrid[iy].push({
                state: this.getState(iy, this.yLength - 1 - ix),
                wallD: newWallD,
                wallR: newWallR
            });
        }
    }
    this.array = newWallGrid;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}


WallGrid.prototype.transform = function(p_transformation, p_xDatum, p_yDatum) {
	switch (p_transformation) {
		case GRID_TRANSFORMATION.ROTATE_CW : this.rotateCWGrid(); break;
		case GRID_TRANSFORMATION.ROTATE_CCW : this.rotateCCWGrid(); break;
		case GRID_TRANSFORMATION.ROTATE_UTURN : this.rotateUTurnGrid(); break;
		case GRID_TRANSFORMATION.MIRROR_HORIZONTAL : this.mirrorHorizontalGrid(); break;
		case GRID_TRANSFORMATION.MIRROR_VERTICAL : this.mirrorVerticalGrid(); break;
		case GRID_TRANSFORMATION.RESIZE : this.resizeGrid(p_xDatum, p_yDatum); break;
	}
}

WallGrid.prototype.rotateUTurnGrid = function () {
    var newWallGrid = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.yLength; iy++) {
        newWallGrid.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            if (ix < this.xLength - 1) {
                newWallR = this.getWallR(this.xLength - 2 - ix, this.yLength - 1 - iy);
            } else {
                newWallR = WALLGRID.CLOSED;
            }
            if (iy < this.yLength - 1) {
                newWallD = this.getWallD(this.xLength - 1 - ix, this.yLength - 2 - iy);
            } else {
                newWallD = WALLGRID.CLOSED;
            }
            newWallGrid[iy].push({
                state: this.getState(this.xLength - 1 - ix, this.yLength - 1 - iy),
                wallD: newWallD,
                wallR: newWallR
            });
        }
    }
    this.array = newWallGrid;
}

WallGrid.prototype.rotateCCWGrid = function () {
    var newWallGrid = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.xLength; iy++) {
        newWallGrid.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
            newWallR = this.getWallD(this.xLength - 1 - iy, ix);
            if (iy < this.xLength - 1)
                newWallD = this.getWallR(this.xLength - 2 - iy, ix);
            else
                newWallD = WALLGRID.CLOSED;
            newWallGrid[iy].push({
                state: this.getState(this.xLength - 1 - iy, ix),
                wallD: newWallD,
                wallR: newWallR
            });
        }
    }
    this.array = newWallGrid;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}

WallGrid.prototype.mirrorHorizontalGrid = function () {
    var newWallGrid = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.yLength; iy++) {
        newWallGrid.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            if (ix < this.xLength - 1) {
                newWallR = this.getWallR(this.xLength - 2 - ix, iy);
            } else {
                newWallR = WALLGRID.CLOSED;
            }
            newWallD = this.getWallD(this.xLength - 1 - ix, iy);

            newWallGrid[iy].push({
                state: this.getState(this.xLength - 1 - ix, iy),
                wallD: newWallD,
                wallR: newWallR
            });
        }
    }
    this.array = newWallGrid;
}

WallGrid.prototype.mirrorVerticalGrid = function () {
    var newWallGrid = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.yLength; iy++) {
        newWallGrid.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            if (iy < this.yLength - 1) {
                newWallD = this.getWallD(ix, this.yLength - 2 - iy);
            } else {
                newWallD = WALLGRID.CLOSED;
            }
            newWallR = this.getWallR(ix, this.yLength - 1 - iy);

            newWallGrid[iy].push({
                state: this.getState(ix, this.yLength - 1 - iy),
                wallD: newWallD,
                wallR: newWallR
            });
        }
    }
    this.array = newWallGrid;
}

WallGrid.prototype.resizeGrid = function (p_xLength, p_yLength) {
    var newWallGrid = [];
    var newWallD,
    newWallR,
    newState;
    for (var iy = 0; iy < p_yLength; iy++) {
        newWallGrid.push([]);
        for (var ix = 0; ix < p_xLength; ix++) {
            if (ix < this.xLength && iy < this.yLength) {
                newState = this.getState(ix, iy);
                newWallD = this.getWallD(ix, iy);
                newWallR = this.getWallR(ix, iy);
            } else {
                newState = WALLGRID.OPEN;
                newWallD = WALLGRID.OPEN;
                newWallR = WALLGRID.OPEN;
            }
            newWallGrid[iy].push({
                state: newState,
                wallD: newWallD,
                wallR: newWallR
            });
        }
    }
    this.array = newWallGrid;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

//-----------

function wallArrayToString(p_wallArray, p_parameters) {
    var xLength = p_wallArray[0].length;
    var yLength = p_wallArray.length;
    var result;
    if (p_parameters && p_parameters.isSquare) {
        result = xLength + " ";
    } else {
        result = xLength + " " + yLength + " ";
    }
    var valueSpace;
    for (var iy = 0; iy < yLength; iy++) {
        for (var ix = 0; ix < xLength; ix++) {
            result += spaceToChar(p_wallArray[iy][ix]);
        }
	}
    return result;
}

/**
Transforms a list of strings (tokens) into a wall array
 */
function tokensToWallArray(p_tokens, p_parameters) {
    var isSquare = (p_parameters && p_parameters.isSquare) ? true : false;
    var xLength;
    var yLength;
    var fieldString;
    xLength = p_tokens[0];
    if (isSquare) {
        yLength = xLength;
        fieldString = p_tokens[1];
    } else {
        yLength = p_tokens[1];
        fieldString = p_tokens[2];
    }
    var result = [];
    for (iy = 0; iy < yLength; iy++) {
        result.push([]);
        for (ix = 0; ix < xLength; ix++) {
            result[iy].push(charToSpace(fieldString.charAt(ix + iy * xLength)));
        }
    }
    return result;
}

/**
Returns the space that matches a char in unparsing function ('0123' => sides down-right = open/closed)
p_char : the desired char
 */
function charToSpace(p_char) {
    switch (p_char) {
    case ('0'):
        return {
            state: WALLGRID.OPEN,
            wallD: WALLGRID.OPEN,
            wallR: WALLGRID.OPEN
        };
        break;
    case ('1'):
        return {
            state: WALLGRID.OPEN,
            wallD: WALLGRID.OPEN,
            wallR: WALLGRID.CLOSED
        };
        break;
    case ('2'):
        return {
            state: WALLGRID.OPEN,
            wallD: WALLGRID.CLOSED,
            wallR: WALLGRID.OPEN
        };
        break;
    case ('3'):
        return {
            state: WALLGRID.OPEN,
            wallD: WALLGRID.CLOSED,
            wallR: WALLGRID.CLOSED
        };
        break;
    default:
        return {
            state: WALLGRID.CLOSED,
            wallD: WALLGRID.OPEN,
            wallR: WALLGRID.OPEN
        };
        break;
    }
}

function spaceToChar(p_space) {
	if (p_space.state == WALLGRID.CLOSED) {
		return SYMBOL_ID.X;		
	}
	var valueSpace = 0;
	if (p_space.wallR == WALLGRID.CLOSED) {
		valueSpace += 1;
	}
	if (p_space.wallD == WALLGRID.CLOSED) {
		valueSpace += 2;
	}
	return valueSpace;
}


/*
		var streamIn = new StreamEncodingString64();

	streamIn.encode64Number(xLength);
	streamIn.encode64Number(yLength);
	*/

// TODO peculiar case of square spaces (SternenSchlacht)
function wallArrayToString64(p_wallArray) {
	// Encode walls by strings of 3 spaces (no banned spaces here)
	const xLength = p_wallArray[0].length;
	const yLength = p_wallArray.length;
	
	// Encode all walls of spaces that are not rightmost and downmost. 
	// Then, binary encode of right wallD (top to bottom) and down wallR (left to right) without the bottom-right space.
	const base4StreamWalls = new StreamEncodingFullBase(4);
	const binaryStreamRDEdges = new StreamEncodingFullBase(2);
	const binaryBlockStream = new StreamEncodingSparseBinary();
	for (var y = 0; y < yLength-1 ; y++) {
		for (var x = 0 ; x < xLength-1 ; x++) {
			base4StreamWalls.encode(
				((p_wallArray[y][x].wallD == WALLGRID.CLOSED) ? 2 : 0) + (p_wallArray[y][x].wallR == WALLGRID.CLOSED ? 1 : 0)
			); // spaceToChar is not enough, we need only walls, not something that may be valued to X
		}
	}
	for (var y = 0; y < yLength-1 ; y++) {
		binaryStreamRDEdges.encode(p_wallArray[y][xLength-1].wallD == WALLGRID.CLOSED);
	}
	for (var x = 0; x < xLength-1 ; x++) {
		binaryStreamRDEdges.encode(p_wallArray[yLength-1][x].wallR == WALLGRID.CLOSED);
	}
	for (var y = 0; y < yLength ; y++) {
		for (var x = 0 ; x < xLength ; x++) {
			binaryBlockStream.encode(p_wallArray[y][x].state == WALLGRID.CLOSED);
		}
	}
	return base4StreamWalls.getString() + binaryStreamRDEdges.getString() + binaryBlockStream.getString();
}
// testing : wallArrayToString64(editorCore.wallGrid.array)

function string64toWallArray(p_string, p_xLength, p_yLength) {
	var result = [];
	for(var y = 0; y < p_yLength; y++) {
		result.push([]);
		for (var x = 0; x < p_xLength; x++) {
			result[y].push(null);
		}
	}
	const base4StreamWalls = new StreamDecodingFullBase(4, p_string);
	for(var y = 0; y < p_yLength-1; y++) {
		for (var x = 0; x < p_xLength-1; x++) {
			result[y][x] = charToSpace(""+base4StreamWalls.decode());
		}
	}
	
	const binaryStreamRDEdges = new StreamDecodingFullBase(2, p_string.substring(base4StreamWalls.getConsumedCharacters()));
	for (var y = 0; y < p_yLength-1 ; y++) {
		result[y][p_xLength-1] = charToSpace("0");
		result[y][p_xLength-1].wallD = (binaryStreamRDEdges.decode() ? WALLGRID.CLOSED : WALLGRID.OPEN);
	}
	for (var x = 0; x < p_xLength-1 ; x++) {
		result[p_yLength-1][x] = charToSpace("0");
		result[p_yLength-1][x].wallR = (binaryStreamRDEdges.decode() ? WALLGRID.CLOSED : WALLGRID.OPEN);
	}
	result[p_yLength-1][p_xLength-1] = charToSpace("0");
	const binaryStreamBan = new StreamDecodingSparseBinary(p_string.substring(binaryStreamRDEdges.getConsumedCharacters() + base4StreamWalls.getConsumedCharacters())); // When several decoding streams decode a same string, take the first index not read yet. Should be obtained through getNextIndex calls.
	for (var y = 0; y < p_yLength; y++) {
		for (var x = 0; x < p_xLength; x++) {
			result[y][x].state = ((binaryStreamBan.decode() == 1) ? WALLGRID.CLOSED : WALLGRID.OPEN); // decode can return END_OF_DECODING_STREAM.
		}
	} // When decoding, make sure that the streaming are the ones corresponding to the ones of encoding
	
	return result;
}