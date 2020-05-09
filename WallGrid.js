function WallGrid(p_wallArray, p_xLength, p_yLength) {
    this.array = p_wallArray;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

function generateWallArray(p_widthGrid, p_heightGrid) {
    return generateSuggestedArray(p_widthGrid, p_heightGrid, WALLGRID.OPEN);
}

function generatePathArray(p_widthGrid, p_heightGrid) {
    return generateSuggestedArray(p_widthGrid, p_heightGrid, WALLGRID.CLOSED);
}

function generateSuggestedArray(p_widthGrid, p_heightGrid, p_startingStateWalls) {
    var answer = [];
    for (var iy = 0; iy < p_heightGrid; iy++) {
        answer.push([]);
        for (var ix = 0; ix < p_widthGrid; ix++) {
            answer[iy].push({
                state: WALLGRID.OPEN,
                wallD: p_startingStateWalls,
                wallR: p_startingStateWalls
            });
        }
    }
    return answer;
}

/**
Converts a grid with walls (right and down) to a "region" grid (regions 1,2,3,...)
 */
WallGrid.prototype.toRegionGrid = function () {
    var regionGridAnswer = [];
    //Create the grid with banned and uncharted spaces
    for (var iy = 0; iy < this.yLength; iy++) {
        regionGridAnswer.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            if (this.array[iy][ix].state == WALLGRID.CLOSED) {
                regionGridAnswer[iy].push(BANNED);
            } else {
                regionGridAnswer[iy].push(UNCHARTED);
            }
        }
    }
    //Region parting :
    var firstX;
    var firstY = 0;
    var regionIndex = 0;
    var spacesThatBelong = [];
    var spaceToPut;
    var x,
    y;
    //Then, go for all non-banned spaces
    while (firstY < this.yLength) {
        firstX = 0;
        while ((firstX < this.xLength) && (regionGridAnswer[firstY][firstX] != UNCHARTED)) { //le dernier true sera à changer quand je ferai des cases destinées à rester à -1
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
                regionGridAnswer[y][x] = regionIndex;
                if ((y > 0) && (regionGridAnswer[y - 1][x] == UNCHARTED) && (this.array[y - 1][x].wallD == WALLGRID.OPEN)) {
                    spacesThatBelong.push({
                        sx: x,
                        sy: y - 1
                    });
                }
                if ((x > 0) && (regionGridAnswer[y][x - 1] == UNCHARTED) && (this.array[y][x - 1].wallR == WALLGRID.OPEN)) {
                    spacesThatBelong.push({
                        sx: x - 1,
                        sy: y
                    });
                }
                if ((y <= this.yLength - 2) && (regionGridAnswer[y + 1][x] == UNCHARTED) && (this.array[y][x].wallD == WALLGRID.OPEN)) {
                    spacesThatBelong.push({
                        sx: x,
                        sy: y + 1
                    });
                }
                if ((x <= this.xLength - 2) && (regionGridAnswer[y][x + 1] == UNCHARTED) && (this.array[y][x].wallR == WALLGRID.OPEN)) {
                    spacesThatBelong.push({
                        sx: x + 1,
                        sy: y
                    });
                }
            }
            regionIndex++;
            firstX++;
        }
        if (firstX == this.xLength) {
            firstX = 0;
            firstY++;
        }
    }
    return regionGridAnswer;
}

WallGrid.prototype.getWallR = function (p_x, p_y) {
    return this.array[p_y][p_x].wallR;
}
WallGrid.prototype.getWallD = function (p_x, p_y) {
    return this.array[p_y][p_x].wallD;
}
WallGrid.prototype.getWallU = function (p_x, p_y) {
    return this.array[p_y - 1][p_x].wallR;
}
WallGrid.prototype.getWallL = function (p_x, p_y) {
    return this.array[p_y][p_x - 1].wallD;
}
WallGrid.prototype.getState = function (p_x, p_y) {
    return this.array[p_y][p_x].state;
}
WallGrid.prototype.setWallR = function (p_x, p_y, p_state) {
    this.array[p_y][p_x].wallR = p_state;
    this.isRegionGridValid = false;
}
WallGrid.prototype.setWallD = function (p_x, p_y, p_state) {
    this.array[p_y][p_x].wallD = p_state;
    this.isRegionGridValid = false;
}
WallGrid.prototype.setWallU = function (p_x, p_y, p_state) {
    this.array[p_y - 1][p_x].wallR = p_state;
    this.isRegionGridValid = false;
}
WallGrid.prototype.setWallL = function (p_x, p_y, p_state) {
    this.array[p_y][p_x - 1].wallD = p_state;
    this.isRegionGridValid = false;
}
WallGrid.prototype.setState = function (p_x, p_y, p_state) {
    this.array[p_y][p_x].state = p_state;
    this.isRegionGridValid = false;
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
    this.setWallU(p_x, p_y, switchedState(this.getWallL(p_x, p_y)));
}
WallGrid.prototype.switchState = function (p_x, p_y) {
    this.setState(p_x, p_y, switchedState(this.getState(p_x, p_y)));
}

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

// Constants for walls and spaces
const WALLGRID = {OPEN : 0, CLOSED : 1} 

function switchedState(p_state) {
    return 1 - p_state;
}

//-----------

function wallArrayToString(p_wallGrid, p_parameters) {
    var xLength = p_wallGrid[0].length;
    var yLength = p_wallGrid.length;
    var answer;
    if (p_parameters && p_parameters.isSquare) {
        answer = xLength + " ";
    } else {
        answer = xLength + " " + yLength + " ";
    }
    var valueSpace;
    for (var iy = 0; iy < yLength; iy++)
        for (var ix = 0; ix < xLength; ix++) {
            if (p_wallGrid[iy][ix].state == WALLGRID.CLOSED) {
                answer += 'X';
            } else {
                valueSpace = 0;
                if (p_wallGrid[iy][ix].wallR == WALLGRID.CLOSED) {
                    valueSpace += 1;
                }
                if (p_wallGrid[iy][ix].wallD == WALLGRID.CLOSED) {
                    valueSpace += 2;
                }
                answer += valueSpace;
            }
        }
    return answer;
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
    var answer = [];
    for (iy = 0; iy < yLength; iy++) {
        answer.push([]);
        for (ix = 0; ix < xLength; ix++) {
            answer[iy].push(charToSpace(fieldString.charAt(ix + iy * xLength)));
        }
    }
    return answer;
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
