function AdjacencyLimit(p_arrays) {
    this.limits = [];
    for (var i = 0; i < p_arrays.length; i++) {
        this.limits.push([]);
        for (var j = 0; j < p_arrays[i].length; j++) {
            this.limits[i].push(p_arrays[i][j]);
        }
    }
}

function AdjacencyLimitNew() {
    return new AdjacencyLimit([[0, 1, 2, 3]]);
}

AdjacencyLimit.prototype.isAccessible = function (p_dir1, p_dir2) {
    if ((p_dir1 == DIRECTION.HERE) || (p_dir2 == DIRECTION.HERE)) {
        return true;
    }
    var index1 = -1;
    var index2 = -1;
    for (var i = 0; i < this.limits.length; i++) {
        this.limits[i].forEach(direction => {
            if (direction == p_dir1) {
                index1 = i;
            }
            if (direction == p_dir2) {
                index2 = i;
            }
        });
    }
    return ((index2 != -1) && (index1 == index2));
}

AdjacencyLimit.prototype.createSideIfNeeded = function (p_dir) {
    var j;
    for (var i = 0; i < this.limits.length; i++) {
        for (j = 0; j < this.limits[i].length; j++) {
            if (this.limits[i][j] == p_dir) {
                return;
            }
        }
    }
    this.limits.push([p_dir]);
}

// Check if a direction is alone among limits. Not bound to L|R|U|D as long as values are unique ! If limit = AB|C|DE|F, then function returns true for C and F and false otherwise.
AdjacencyLimit.prototype.isDirectionAlone = function (p_dir) {
    var j;
    for (var i = 0; i < this.limits.length; i++) {
		if (this.limits[i][0] == p_dir) {
			return (this.limits[i].length == 1);
		}
    }
    return false;
}

/**
Puts both directions in the same side of the limit.
Precondition : one of them MUST bind the other one and not be already bound.
 */
AdjacencyLimit.prototype.bindDirections = function (p_dir1, p_dir2) {
    var index1 = -1;
    var index2 = -1;
    for (var i = 0; i < this.limits.length; i++) {
        this.limits[i].forEach(direction => {
            if (direction == p_dir1) {
                index1 = i;
            }
            if (direction == p_dir2) {
                index2 = i;
            }
        });
    }
    if (index1 == -1) {
        if (index2 == -1) {
            this.limits.push([p_dir1, p_dir2]); // Directions aren't already pushed into the AL : create a new side with them.
        } else {
            this.limits[index2].push(p_dir1); // Diection 2 is already pushed but not direction 1 : put them together
        }
    } else {
        this.limits[index1].push(p_dir2); // Direction 1 is already pushed but not direction 2 : put them together
    }
}

AdjacencyLimit.prototype.toString = function () {
    var answer = "";
    var separate = "";
    var j;
    for (var i = 0; i < this.limits.length; i++) {
        answer += separate;
        separate = "|";
        for (j = 0; j < this.limits[i].length; j++) {
            answer += this.limits[i][j];
        }
    }
    return answer;
}

AdjacencyLimit.prototype.copy = function () {
    var answer = new AdjacencyLimit([]);
    for (var i = 0; i < this.limits.length; i++) {
        answer.limits.push(this.limits[i].slice());
    }
    return answer;
}

AdjacencyLimit.prototype.orderedCopy = function () {
    var answer = new AdjacencyLimit([]);
    for (var i = 0; i < this.limits.length; i++) {
        answer.limits.push(this.limits[i].slice().sort());
    };
    answer.limits.sort(function (a, b) {
        if (a[0] > b[0])
            return 1;
        return -1;
    });
    return answer;
}

/**
Tests if 2 limits are equal logically (representations of sides are the same : LU|RD is the same as RD|UL)
 */
AdjacencyLimit.prototype.equals = function (p_other) {
    if (this.limits.length != p_other.limits.length) {
        return false;
    }
    const oc1 = this.orderedCopy();
    const oc2 = p_other.orderedCopy();
    var j;
    for (var i = 0; i < oc1.limits.length; i++) {
        if (oc1.limits[i].length != oc2.limits[i].length) {
            return false;
        }
        for (j = 0; j < oc1.limits[i].length; j++) {
            if (oc1.limits[i][j] != oc2.limits[i][j]) {
                return false;
            }
        }
    }
    return true;
}
// Unit test : new AdjacencyLimit(["UXLA","DCB","FGE"]).equals(new AdjacencyLimit(["CBD","ALXU","EGF"])); should return true

function createAdjacencyLimitGrid(p_xLength, p_yLength) {
    var x;
    var answer = [];
    for (var y = 0; y < p_yLength; y++) {
        answer.push([]);
        for (x = 0; x < p_xLength; x++) {
            answer[y].push(AdjacencyLimitNew());
        }
    }
    return answer;
}

//Function for debug : better readability of an array of AdjacencyLimit
//Example of use : arrayAdjacencyLimitToString(this.solver.adjacencyLimitGrid) OR arrayAdjacencyLimitToString(solver.adjacencyLimitGrid)
function arrayAdjacencyLimitToString(p_array) {
    var answer = "";
    var x;
    var i;
    var stringSpace;
    for (var y = 0; y < p_array.length; y++) {
        for (x = 0; x < p_array[0].length; x++) {
            stringSpace = p_array[y][x].toString();
            answer += stringSpace;
            for (i = stringSpace.length; i < 8; i++) {
                answer += " ";
            }
        }
        answer += "\n";
    }
    return answer;
}
