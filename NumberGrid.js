/*
"Number grid : Grid that holds numbers ; it is dependent on a wallGrid and its corresponding regionGrid, because there should not be more than one number per region."
 */

function NumberGrid(p_numberArray, p_xLength, p_yLength, p_defaultNumber) {
    this.array = p_numberArray;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

function generateNumberArray(p_widthGrid, p_heightGrid, p_defaultNumber) {
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
Aligns number according to a region grid in a way that exactly one number is contained in each region that has one.
Preconditions :
-The region grid MUST be standardized (in reading order of first space in reading order of regions.)
-There shouldn't be more than one number in each region. Some regions may contain 0 such number.
Post condition :
-Each region contains either zero number or one, and that number is in the upper and then lefter space of the region.
 */
NumberGrid.prototype.arrangeNumbers = function (p_regionGrid) {
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
            if (this.array[iy][ix] != this.defaultNumber) {
                firstX = firstSpacesX[ir];
                firstY = firstSpacesY[ir];
                if (firstX != ix || firstY != iy) {
                    this.array[firstY][firstX] = this.array[iy][ix];
                    this.array[iy][ix] = this.defaultNumber;
                }
            }
        }
    }
}

NumberGrid.prototype.getNumber = function (p_x, p_y) {
    return this.array[p_y][p_x]
}
NumberGrid.prototype.setNumber = function (p_x, p_y, p_number) {
    this.array[p_y][p_x] = p_number
}
NumberGrid.prototype.clearNumber = function (p_x, p_y) {
    this.array[p_y][p_x] = null
}
const DEFAULT_NUMBER = 0; //TODO c'est le nombre par défaut. Est-ce ce que nous voulons ?

NumberGrid.prototype.rotateCWGrid = function () {
    var newNumberArray = [];
    var newWallR;
    var newWallD;
    for (var iy = 0; iy < this.xLength; iy++) {
        newNumberArray.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
            newNumberArray[iy].push(this.getNumber(iy, this.yLength - 1 - ix));
        }
    }
    this.array = newNumberArray;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}

NumberGrid.prototype.rotateUTurnGrid = function () {
    var newNumberArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newNumberArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            newNumberArray[iy].push(this.getNumber(this.xLength - 1 - ix, this.yLength - 1 - iy));
        }
    }
    this.array = newNumberArray;
}

NumberGrid.prototype.rotateCCWGrid = function () {
    var newNumberArray = [];
    for (var iy = 0; iy < this.xLength; iy++) {
        newNumberArray.push([]);
        for (var ix = 0; ix < this.yLength; ix++) {
            newNumberArray[iy].push(this.getNumber(this.xLength - 1 - iy, ix));
        }
    }
    this.array = newNumberArray;
    var saveXLength = this.xLength;
    this.xLength = this.yLength;
    this.yLength = saveXLength;
}

NumberGrid.prototype.mirrorHorizontalGrid = function () {
    var newNumberArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newNumberArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            newNumberArray[iy].push(this.getNumber(this.xLength - 1 - ix, iy));
        }
    }
    this.array = newNumberArray;
}

NumberGrid.prototype.mirrorVerticalGrid = function () {
    var newNumberArray = [];
    for (var iy = 0; iy < this.yLength; iy++) {
        newNumberArray.push([]);
        for (var ix = 0; ix < this.xLength; ix++) {
            newNumberArray[iy].push(this.getNumber(ix, this.yLength - 1 - iy));
        }
    }
    this.array = newNumberArray;
}

NumberGrid.prototype.resizeGrid = function (p_xLength, p_yLength) {
    var newNumberArray = [];
    var number;
    for (var iy = 0; iy < p_yLength; iy++) {
        newNumberArray.push([]);
        for (var ix = 0; ix < p_xLength; ix++) {
            if (ix < this.xLength && iy < this.yLength) {
                number = this.getNumber(ix, iy);
            } else {
                number = DEFAULT_NUMBER;
            }
            newNumberArray[iy].push(number);
        }
    }
    this.array = newNumberArray;
    this.xLength = p_xLength;
    this.yLength = p_yLength;
}

//---------------------

function numberArrayToString(p_numberArray, p_defaultValue) {
    xLength = p_numberArray[0].length;
    yLength = p_numberArray.length;
    var numbersChain = "";
    for (var iy = 0; iy < yLength; iy++) {
        for (var ix = 0; ix < xLength; ix++) {
            if (p_numberArray[iy][ix] != null) {
                numbersChain += (ix + " " + iy + " " + p_numberArray[iy][ix] + " ");
            }
        }
    }
    return numbersChain;
}

function tokensToNumberArray(p_tokens, p_xLength, p_yLength, p_defaultValue) {
    var p_array = generateNumberArray(p_xLength, p_yLength, null);
    var indexToken = 0;
    //TODO : HOTFIX de compatibilité avec l'ancien format
    if (p_tokens[0].startsWith("Numbers")) {
        indexToken++;
    }
    while (indexToken < p_tokens.length - 2) {
        p_array[parseInt(p_tokens[indexToken + 1], 10)]
        [parseInt(p_tokens[indexToken], 10)] = parseInt(p_tokens[indexToken + 2], 10);
        indexToken += 3;
    }
    return p_array;
}
