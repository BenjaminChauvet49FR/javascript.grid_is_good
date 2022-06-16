const CURVING_WAY = {
    LEFT_VERTICAL : 'L',
    RIGHT_VERTICAL : 'R',
    HORIZONTAL : 'H',
    VERTICAL : 'V'
}

function SolverCurvingRoad(p_symbolArray) {
    this.construct(p_symbolArray);
}

SolverCurvingRoad.prototype = Object.create(GeneralSolver.prototype);
SolverCurvingRoad.prototype.constructor = SolverCurvingRoad;

function DummySolver() {
	return new SolverCurvingRoad(generateSymbolArray(1, 1));
}

SolverCurvingRoad.prototype.construct = function (p_symbolArray) {
	this.generalConstruct();
    this.xLength = p_symbolArray[0].length;
    this.yLength = p_symbolArray.length;
    this.answerArray = [];
    this.curvingLinkArray = [];
    this.curvingLinkList = [];
    this.pearlArray = [];
	this.pearlSpacesList = [];

    var ix, iy;

	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this)));
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForSpacePassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	
    for (iy = 0; iy < this.yLength; iy++) {
        this.answerArray.push([]);
        this.curvingLinkArray.push([]);
        this.pearlArray.push([]);
        for (ix = 0; ix < this.xLength; ix++) {
            this.curvingLinkArray[iy].push([]);
            if (p_symbolArray[iy][ix] == SYMBOL_ID.WHITE) {
                this.answerArray[iy].push(ADJACENCY.YES);
                this.pearlArray[iy].push(true);
				this.pearlSpacesList.push({x : ix, y : iy});
            } else {
                this.answerArray[iy].push(ADJACENCY.UNDECIDED);
                this.pearlArray[iy].push(false);
            }
        }
    }

    for (iy = 0; iy < this.yLength; iy++) {
        for (ix = 0; ix < this.xLength; ix++) {
            if (p_symbolArray[iy][ix] == SYMBOL_ID.WHITE) {
                this.traceRoadsFrom(ix, iy);
            }
        }
    }
    for (iy = 0; iy < this.yLength; iy++) {
        for (ix = 0; ix < this.xLength; ix++) {
            this.determineInvalidRoadsFrom(ix, iy);
        }
    }
    for (iy = 0; iy < this.yLength; iy++) {
        for (ix = 0; ix < this.xLength; ix++) {
            this.purgeRoadsFrom(ix, iy);
        }
    }
	this.declarationsOpenAndClosed();
}

SolverCurvingRoad.prototype.traceRoadsFrom = function (p_x, p_y) {
    var bottomRow = (p_y == this.yLength - 1);
    var rightColumn = (p_x == this.xLength - 1);
    var leftColumn = (p_x == 0);
    var lastX, lastY;
    var x,
    y;
    var shouldMoveOn;
    var shouldTrace;
    //Note : no link should be contained in anoteher by now

    if (!rightColumn) {
        lastX = p_x; //Right only
        do {
            shouldTrace = (lastX < this.xLength - 1);
            shouldMoveOn = shouldTrace && (this.answerArray[p_y][lastX + 1] != ADJACENCY.YES);
            if (shouldMoveOn) {
                lastX++;
            }
        } while (shouldMoveOn);
        if (shouldTrace) {
            this.traceRoad(p_x + 1, p_y, lastX, p_y, CURVING_WAY.HORIZONTAL);
            lastX--;
        }
        if (!bottomRow) { // Right then down
            for (x = p_x + 1; x <= lastX; x++) {
                lastY = p_y;
                do {
                    shouldTrace = (lastY < this.yLength - 1);
                    shouldMoveOn = (shouldTrace && this.answerArray[lastY + 1][x] != ADJACENCY.YES);
                    if (shouldMoveOn) {
                        lastY++;
                    }
                } while (shouldMoveOn);
                if (shouldTrace) {
                    this.traceRoad(p_x + 1, lastY, x, p_y, CURVING_WAY.RIGHT_VERTICAL);
                }
            }
        }
    }

    //Down only
    if (!bottomRow) {
        lastY = p_y;
        do {
            shouldTrace = (lastY < this.yLength - 1);
            shouldMoveOn = shouldTrace && (this.answerArray[lastY + 1][p_x] != ADJACENCY.YES);
            if (shouldMoveOn) {
                lastY++;
            }
        } while (shouldMoveOn);
        if (shouldTrace) {
            this.traceRoad(p_x, p_y + 1, p_x, lastY, CURVING_WAY.VERTICAL);
            lastY--;
        }
        //Down then right, followed by down then left
        for (y = p_y + 1; y <= lastY; y++) {
            lastX = p_x;
            do {
                shouldTrace = (lastX < this.xLength - 1);
                shouldMoveOn = (shouldTrace && this.answerArray[y][lastX + 1] != ADJACENCY.YES);
                if (shouldMoveOn) {
                    lastX++;
                }
            } while (shouldMoveOn);
            if (shouldTrace) {
                this.traceRoad(lastX, p_y + 1, p_x, y, CURVING_WAY.LEFT_VERTICAL);
            }
            lastX = p_x;
            do {
                shouldTrace = (lastX > 0);
                shouldMoveOn = (shouldTrace && this.answerArray[y][lastX - 1] != ADJACENCY.YES);
                if (shouldMoveOn) {
                    lastX--;
                }
            } while (shouldMoveOn);
            if (shouldTrace) {
                this.traceRoad(lastX, p_y + 1, p_x, y, CURVING_WAY.RIGHT_VERTICAL);
                lastX++;
            }
        }
    }

    // Left then down (like "right only" and "right then down" except we don't trace the left only
    if (!leftColumn) {
        lastX = p_x;
        do {
            shouldTrace = (lastX > 0);
            shouldMoveOn = (shouldTrace && this.answerArray[p_y][lastX - 1] != ADJACENCY.YES);
            if (shouldMoveOn) {
                lastX--;
            }
        } while (shouldMoveOn);
        for (x = p_x - 1; x >= lastX; x--) {
            lastY = p_y;
            do {
                shouldTrace = (lastY < this.yLength - 1);
                shouldMoveOn = (shouldTrace && this.answerArray[lastY + 1][x] != ADJACENCY.YES);
                if (shouldMoveOn) {
                    lastY++;
                }
            } while (shouldMoveOn);
            if (shouldTrace) {
                this.traceRoad(p_x - 1, lastY, x, p_y, CURVING_WAY.LEFT_VERTICAL);
            }
        }
    }
}

// Adds the following links : (xEnd,yJunction <=> xJunction,yJunction) and (xJunction,yJunction <=> xJunction,yEnd)
// Including both end spaces and only once the junction space.
SolverCurvingRoad.prototype.traceRoad = function (p_xEnd, p_yEnd, p_xJunction, p_yJunction, p_way) {
    const index = this.curvingLinkList.length;
    const xMin = Math.min(p_xEnd, p_xJunction);
    const xMax = Math.max(p_xEnd, p_xJunction);
    const yMin = Math.min(p_yEnd, p_yJunction);
    const yMax = Math.max(p_yEnd, p_yJunction);
    this.curvingLinkList.push({
        humanRead: "",
        horizontalAxis: null,
        verticalAxis: null,
        point: null,
        valid: true,
        undecided: xMax - xMin + yMax - yMin + 1,
        closeds: 0
    });
    if (xMin != xMax) {
        this.curvingLinkList[index].horizontalAxis = {
            xMin: xMin,
            xMax: xMax,
            y: p_yJunction
        }
        this.curvingLinkList[index].humanRead += "(" + xMin + "-" + xMax + "," + p_yJunction + ") ";
    }
    if (yMin != yMax) {
        this.curvingLinkList[index].verticalAxis = {
            yMin: yMin,
            yMax: yMax,
            x: p_xJunction
        }
        this.curvingLinkList[index].humanRead += "(" + p_xJunction + "," + yMin + "-" + yMax + ") ";
    } else if (xMin == xMax) {
        this.curvingLinkList[index].point = {
            x: xMin,
            y: yMin
        }
        this.curvingLinkList[index].humanRead = "(" + xMin + "," + yMin + ")";
    }

    for (var x = xMin + 1; x <= xMax - 1; x++) {
        this.curvingLinkArray[p_yJunction][x].push(index);
    }
    for (var y = yMin + 1; y <= yMax - 1; y++) {
        this.curvingLinkArray[y][p_xJunction].push(index);
    }
    this.curvingLinkArray[p_yJunction][p_xJunction].push(index);
    if (p_yEnd != p_yJunction) {
        this.curvingLinkArray[p_yEnd][p_xJunction].push(index);
    }
    if (p_xEnd != p_xJunction) {
        this.curvingLinkArray[p_yJunction][p_xEnd].push(index);
    }
}

// Note : links are built in a way no bended link (with both an horizontal and a vertical link) can be contained.
function contains(p_linkContainer, p_linkContainee) {
    if (p_linkContainee.point != null) {
        const x = p_linkContainee.point.x;
        const y = p_linkContainee.point.y;
        if ((p_linkContainer.point != null) && (p_linkContainer.point.x == x) && (p_linkContainer.point.y == y)) {
            return true;
        } else {
            const hAxis = p_linkContainer.horizontalAxis;
            if (hAxis != null && hAxis.y == y && hAxis.xMin <= x && hAxis.xMax >= x) {
                return true;
            }
            const vAxis = p_linkContainer.verticalAxis;
            if (vAxis != null && vAxis.x == x && vAxis.yMin <= y && vAxis.yMax >= y) {
                return true;
            }
            return false;
        }
    }

    const hAxisIn = p_linkContainee.horizontalAxis;
    const vAxisIn = p_linkContainee.verticalAxis;
    var hContain = false;
    var vContain = false;
    //Horizontal check
    if (hAxisIn == null) {
        hContain = true;
    } else {
        const hAxis = p_linkContainer.horizontalAxis;
        hContain = (hAxis != null && hAxis.y == hAxisIn.y && hAxis.xMin <= hAxisIn.xMin && hAxis.xMax >= hAxisIn.xMax);
    }
    if (!hContain) {
        return false;
    }
    //Then vertical check
    if (vAxisIn == null) {
        vContain = true;
    } else {
        const vAxis = p_linkContainer.verticalAxis;
        vContain = (vAxis != null && vAxis.x == vAxisIn.x && vAxis.yMin <= vAxisIn.yMin && vAxis.yMax >= vAxisIn.yMax);
    }
    return vContain;
}

SolverCurvingRoad.prototype.determineInvalidRoadsFrom = function (p_x, p_y) {
    var array = this.curvingLinkArray[p_y][p_x];
    var i,
    j;
    var aI,
    aJ;
    for (i = 0; i < array.length; i++) {
        aI = array[i];
        if (this.curvingLinkList[aI].valid) {
            for (j = 0; j < i; j++) {
                aJ = array[j];
                if (contains(this.curvingLinkList[aI], this.curvingLinkList[aJ])) {
                    this.curvingLinkList[aI].valid = false;
                } else {
                    if (contains(this.curvingLinkList[aJ], this.curvingLinkList[aI])) {
                        this.curvingLinkList[aJ].valid = false;
                    }
                }
            }
        }
    }
}

// On aurait pu purger les routes d'une case p_x,p_y donnée juste après avoir déterminé si les routes de cette case sont valides ou non...
// Mais c'est pas bon du tout. Une route peut très bien être valide sur une case et devenir invalide lorsqu'on explore la case suivante.
// Pour rappel, une route est invalide lorsqu'elle contient entièrement une autre route. C'est la logique de ce casse-tête.
SolverCurvingRoad.prototype.purgeRoadsFrom = function (p_x, p_y) {
    // array = array.filter(function(index) {return this.curvingLinkList[index].valid;});*/
    // Malheureusement, le this à l'intérieur de cette fonction est un window. Je suis donc obligé de faire un filtrage manuel. (ce que je voulais faire au départ, soi-dit en passant, mais il n'y a pas de méthode delete ???)
    var array = this.curvingLinkArray[p_y][p_x];
    var newArray = [];
    for (i = 0; i < array.length; i++) {
        if (this.curvingLinkList[array[i]].valid == true) {
            newArray.push(array[i]);
        } else {
            this.curvingLinkList[array[i]].humanRead = "";
        }
    }
    //array = newArray;
    // Réaffecter array ne change pas la variable qui était référencée (case de this.curvingLinkArray dans notre cas)
    this.curvingLinkArray[p_y][p_x] = newArray.slice();
}

SolverCurvingRoad.prototype.getAnswer = function (p_x, p_y) {
    return this.answerArray[p_y][p_x];
}

SolverCurvingRoad.prototype.getPearl = function (p_x, p_y) {
    return this.pearlArray[p_y][p_x];
}

//--------------------------------
// Input methods

SolverCurvingRoad.prototype.emitHypothesis = function (p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverCurvingRoad.prototype.makeQuickStart = function () {
	this.quickStart();
}

SolverCurvingRoad.prototype.passSpace = function(p_x, p_y) {
	const listPassNow = this.generateEventsForSpacePass({x : p_x, y : p_y});
	this.passEventsSafe(listPassNow, {x : p_x, y : p_y}); 
}

SolverCurvingRoad.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}

SolverCurvingRoad.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

//--------------------------------

// Doing, undoing and transforming
SolverCurvingRoad.prototype.putNew = function (p_x, p_y, p_symbol) {
    if (this.answerArray[p_y][p_x] == p_symbol) {
        return EVENT_RESULT.HARMLESS;
    }
    if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
        return EVENT_RESULT.FAILURE;
    }
    this.answerArray[p_y][p_x] = p_symbol;
    this.curvingLinkArray[p_y][p_x].forEach(
        index => {
        this.curvingLinkList[index].undecided--;
        if (p_symbol == ADJACENCY.NO) {
            this.curvingLinkList[index].closeds++;
        }
    });
    return EVENT_RESULT.SUCCESS;
}

applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		return p_solver.putNew(p_eventToApply.x, p_eventToApply.y, p_eventToApply.symbol);
	}
}

undoEventClosure = function(p_solver) {
	return function (p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const symbol = p_eventToApply.symbol;
		p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
		p_solver.curvingLinkArray[y][x].forEach(
			index => {
			p_solver.curvingLinkList[index].undecided++;
			if (symbol == ADJACENCY.NO) {
				p_solver.curvingLinkList[index].closeds--;
			}
		});
	}
}

//--------------------------------
// Exchanges solver and geographical

adjacencyClosure = function(p_solver) {
    return function (p_x, p_y) {
        return p_solver.answerArray[p_y][p_x];
    }
};

transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
};


//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Curving road"}];		
		p_solver.curvingLinkList.forEach(curvingLink => {
			if (curvingLink.valid && (curvingLink.point != null)) {
				listQSEvents.push(new SpaceEvent(curvingLink.point.x, curvingLink.point.y, ADJACENCY.NO));
			}
		});
		return listQSEvents;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		x = p_eventBeingApplied.x;
		y = p_eventBeingApplied.y;
		if (p_eventBeingApplied.symbol == ADJACENCY.NO) {
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {				
				p_listEventsToApply.push(new SpaceEvent(coorsDir.x, coorsDir.y, ADJACENCY.YES));
			});
		} else {
			p_solver.curvingLinkArray[y][x].forEach(index => {
				p_solver.deductionsTestAlertCurvingList(p_listEventsToApply, index); 
			});
		}
	}	
}

SolverCurvingRoad.prototype.deductionsTestAlertCurvingList = function (p_listEventsToApply, p_index) {
    const curvingLink = this.curvingLinkList[p_index];
    if (curvingLink.undecided == 1 && curvingLink.closeds == 0) {
        var xSpot,
        ySpot;
        xSpot = -1;
        var axis = curvingLink.horizontalAxis;
        if (axis != null) {
            var y = axis.y;
            for (var x = axis.xMin; x <= axis.xMax; x++) {
                if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
                    xSpot = x;
                    ySpot = y;
                    break;
                }
            }
        }
        if (xSpot == -1) {
            axis = curvingLink.verticalAxis;
            var x = axis.x;
            for (var y = axis.yMin; y <= axis.yMax; y++) {
                if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
                    xSpot = x;
                    ySpot = y;
                    break;
                }
            }
        }
        p_listEventsToApply.push(new SpaceEvent(xSpot, ySpot, ADJACENCY.NO));
    }
}

//--------------------------------
// Passing and multipassing

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return this.commonComparison([p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol]);
}

namingCategoryPassClosure = function(p_solver) {
	return function (p_space) {
		return "Space ("+p_space.x+","+p_space.y+")"; 
	}
}

generateEventsForSpacePassClosure = function(p_solver) {
	return function(p_space) {
		return p_solver.generateEventsForSpacePass(p_space);
	}
}

SolverCurvingRoad.prototype.generateEventsForSpacePass = function(p_space) {
	return [[new SpaceEvent(p_space.x, p_space.y, ADJACENCY.NO), new SpaceEvent(p_space.x, p_space.y, ADJACENCY.YES)]];
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		listIndexesPass = [];
		for(var iy = 0; iy < p_solver.yLength ; iy++) { // WARNING : putting "this" instead of "p_solver" leads to the expression in the "if" being false, but not crashing, which can lead to a quite fun debugging time !
			for(var ix = 0; ix < p_solver.xLength ; ix++) {
				if (p_solver.answerArray[iy][ix] == ADJACENCY.UNDECIDED) {
					listIndexesPass.push({x : ix, y : iy});
				}
			}
		}
		return listIndexesPass;
	}
}