const ADJACENCY = {
    YES: 1,
    NO: 0,
    UNDEFINED: -1
};
const DIRECTION = {
    LEFT: 'L',
    UP: 'U',
    RIGHT: 'R',
    DOWN: 'D',
    HERE: 'H',
    UNDEFINED: '-'
};
const FOUR_DIRECTIONS_STRING = "LURD";

const TASK = {
    TBD: 0,
    DONE: 1
};
const UNDEFINED_INDEX = -1;

const TBD_DIRECTIONS = {
    D: TASK.TBD,
    L: TASK.TBD,
    U: TASK.TBD,
    R: TASK.TBD
};

var turningLeftGrid = null;
var indexClustersGrid = null;
var amountGrid = null;
var newBarriersGrid = null;
var directionsGrid = null;
var newAdjacencyLimit = null;

function restartGrid(p_array, p_xLength, p_yLength, p_value) {
    if ((p_array == null) || (p_yLength != p_array.length) || (p_xLength != p_array[0].length)) {
        p_array = [];
        var x;
        for (var y = 0; y < p_yLength; y++) {
            p_array.push([]);
            for (x = 0; x < p_xLength; x++) {
                p_array[y].push(p_value);
            }
        }
    }
    return p_array;
}

function restartGridComplex(p_array, p_xLength, p_yLength, p_value) {
    if ((p_array == null) || (p_yLength != p_array.length) || (p_xLength != p_array[0].length)) {
        p_array = [];
        var x;
        for (var y = 0; y < p_yLength; y++) {
            p_array.push([]);
            for (x = 0; x < p_xLength; x++) {
                p_array[y].push({
                    L: p_value.L,
                    U: p_value.U,
                    R: p_value.R,
                    D: p_value.D
                });
                // Si on avait mis p_value, on passerait directement un pointeur sur un objet dans le tableau, et toutes les cases contiendraient la même valeur, juste accédée via des pointeurs différents.
                // Une modification dans une seule des cases entraînerait une modification sur toutes les cases puisque cette valeur serait partagée.
            }
        }
    }
    return p_array;
}

function cleanGridList(p_array, p_list, p_value) {
    p_list.forEach(space => {
        p_array[space.y][space.x] = p_value;
    });
    return p_array;
}

function cleanGridListComplex(p_array, p_list, p_value) {
    p_list.forEach(space => {
        p_array[space.y][space.x] = {
            L: p_value.L,
            U: p_value.U,
            R: p_value.R,
            D: p_value.D
        }
        // Même remarque que dans la version "non naturelle" de restartGrid (aka restartGridComplex sauf si changement de nom)
    });
    return p_array;
}

/*
THE function to eliminate closed clusters. However, the grid must have at least one ADJACENCY.YES placed to use it, otherwise there would be no use in detecting clusters and you don't know which ones to close.
p_listNewADJACENCY p_listNewBARRIER are {x,y} positions of ADJACENCY.YES and ADJACENCY.NO spaces since the last time it was checked.
p_function returns true or false depending on whether it is open or not.

// TODO optimisation possible : vérifier en temps réel pour chaque cluster s'il est en développement ou non plutôt qu'à la fin d'une boucle.
 */
function adjacencyCheck(p_listNewBARRIER, p_limitArray, p_formerLimitSpaceList, p_function, p_xLength, p_yLength) {
    amountGrid = restartGrid(amountGrid, p_xLength, p_yLength, 0);
    indexClustersGrid = restartGrid(indexClustersGrid, p_xLength, p_yLength, UNDEFINED_INDEX);
    turningLeftGrid = restartGridComplex(turningLeftGrid, p_xLength, p_yLength, TBD_DIRECTIONS);

    //Create "clusters"
    var clusterList = [];
    var index = 0;
    var spacesToCheck = [];

    function testAdjacentToADJACENCY_NO(p_xx, p_yy) {
        const value = p_function(p_xx, p_yy);
        if ((value != ADJACENCY.NO) && (indexClustersGrid[p_yy][p_xx] == UNDEFINED_INDEX)) {
            indexClustersGrid[p_yy][p_xx] = index;
            spacesToCheck.push({
                x: p_xx,
                y: p_yy
            });
            clusterList.push({
                spaces: [{
                        x: p_xx,
                        y: p_yy
                    }
                ],
                containADJACENCY: (value == ADJACENCY.YES),
                linked: -1
            });
            index++;
        }
    }

    p_listNewBARRIER.forEach(space => {
        const x = space.x;
        const y = space.y;
        if (x > 0) {
            testAdjacentToADJACENCY_NO(x - 1, y);
        }
        if (y > 0) {
            testAdjacentToADJACENCY_NO(x, y - 1);
        }
        if (x < p_xLength - 1) {
            testAdjacentToADJACENCY_NO(x + 1, y);
        }
        if (y < p_yLength - 1) {
            testAdjacentToADJACENCY_NO(x, y + 1);
        }
    });

    var space,
    x,
    y,
    clusterIndex;

    function actualClusterIndex(p_clusterIndex) {
        while (clusterList[p_clusterIndex].linked != UNDEFINED_INDEX) {
            p_clusterIndex = clusterList[p_clusterIndex].linked;
        }
        return p_clusterIndex;
    }

    function checkSpace(p_xx, p_yy, p_clusterIndexOrigin) {
        var value = p_function(p_xx, p_yy);
        if (value != ADJACENCY.NO) {
            var actualIndex = actualClusterIndex(p_clusterIndexOrigin);
            var clusterIndexNewSpace = indexClustersGrid[p_yy][p_xx];
            if (clusterIndexNewSpace == UNDEFINED_INDEX) {
                indexClustersGrid[p_yy][p_xx] = actualIndex;
                if (value == ADJACENCY.YES) {
                    clusterList[actualIndex].containADJACENCY = true;
                }
                clusterList[actualIndex].spaces.push({
                    x: p_xx,
                    y: p_yy
                });
                futureSpacesToCheck.push({
                    x: p_xx,
                    y: p_yy
                });
            } else {
                purgeLog("checkSpace - merge (may be outdated indexes) - (" + p_xx + "," + p_yy + ") " + p_clusterIndexOrigin + " <-> " + clusterIndexNewSpace);
                var secondActualIndex = actualClusterIndex(clusterIndexNewSpace);
                var indexReceiver = actualIndex;
                if (actualIndex != secondActualIndex) {
                    //Opération de fusion entre 2 clusters
                    indexReceiver = (clusterList[actualIndex].spaces.length > clusterList[secondActualIndex].spaces.length) ? actualIndex : secondActualIndex;
                    var indexGiver = (indexReceiver == secondActualIndex) ? actualIndex : secondActualIndex;
                    Array.prototype.push.apply(clusterList[indexReceiver].spaces, clusterList[indexGiver].spaces);
                    clusterList[indexReceiver].containADJACENCY = clusterList[indexReceiver].containADJACENCY || clusterList[indexGiver].containADJACENCY;
                    clusterList[indexGiver].linked = indexReceiver;
                }
            }
        }
    }

    function getActualClusterIndexFromSpace(p_space) {
        return actualClusterIndex(indexClustersGrid[p_space.y][p_space.x])
    }

    var futureSpacesToCheck;
    var moreToDig = (spacesToCheck.length > 0);
    var actualIndexCluster0,
    i;
    var failureClustersWithAdjacency = false;
    while (spacesToCheck.length > 0 && moreToDig && !failureClustersWithAdjacency) {
        futureSpacesToCheck = [];
        for (i = 0; i < spacesToCheck.length; i++) {
            space = spacesToCheck[i];
            x = space.x;
            y = space.y;
            clusterIndex = actualClusterIndex(indexClustersGrid[y][x]);
            if (x > 0) {
                checkSpace(x - 1, y, clusterIndex);
            }
            if (y > 0) {
                checkSpace(x, y - 1, clusterIndex);
            }
            if (x < p_xLength - 1) {
                checkSpace(x + 1, y, clusterIndex);
            }
            if (y < p_yLength - 1) {
                checkSpace(x, y + 1, clusterIndex);
            }
        }
        spacesToCheck = futureSpacesToCheck;
        //TODO voilà la fameuse fin de boucle où j'effectue les tests
        clusterList.forEach(cluster => {
            cluster.fullyDigged = true;
        });
        if (futureSpacesToCheck.length > 0) {
            var numberNonFullyDiggedClusters = 0;
            var numberNonFullyDiggedClustersWithoutADJACENCY = 0;
            futureSpacesToCheck.forEach(space => {
                var actualCluster = getActualClusterIndexFromSpace(space);
                if (clusterList[actualCluster].fullyDigged) {
                    clusterList[actualCluster].fullyDigged = false;
                    numberNonFullyDiggedClusters++;
                    if (!clusterList[actualCluster].containADJACENCY) {
                        numberNonFullyDiggedClustersWithoutADJACENCY++;
                    }
                }
            });
            moreToDig = ((numberNonFullyDiggedClusters > 1) || (numberNonFullyDiggedClustersWithoutADJACENCY > 0));
            var alreadyHas1ClosedClusterWithADJ = false;
            var alreadyHasSomeClusterWithADJ = false;
            clusterList.forEach(cluster => {
                if (cluster.linked == UNDEFINED_INDEX && cluster.containADJACENCY) {
                    if (cluster.fullyDigged) {
                        if (alreadyHas1ClosedClusterWithADJ || alreadyHasSomeClusterWithADJ) {
                            failureClustersWithAdjacency = true;
                        }
                        alreadyHas1ClosedClusterWithADJ = true;
                    } else {
                        if (alreadyHas1ClosedClusterWithADJ) {
                            failureClustersWithAdjacency = true;
                        }
                        alreadyHasSomeClusterWithADJ = true;
                    }
                }
            });

        } else {
            moreToDig = false;
        }
    }

    clusterList.forEach(cluster => {
        indexClustersGrid = cleanGridList(indexClustersGrid, cluster.spaces, UNDEFINED_INDEX);
    });

    if (failureClustersWithAdjacency) {
        return {
            success: false
        }
    }

    // Next step : turn left policy
    //List the new limit spaces, e.g. the ones that are crossed more than once when
    //we walk around the barrier spaces (starting with the new barriers) and turn left when possible (like a bug (or paramecium ?) in Chip's Challenge).
    var listSpacesClustersBarriered = [];
    var numberOfClustersWithAdjacency = 0;

    function isPotentiallyAdjacent(p_x, p_y) {
        return ((!newBarriersGrid[p_y][p_x]) && (p_function(p_x, p_y) != ADJACENCY.NO));
    }

    if (clusterList.length != 0) {
        newBarriersGrid = restartGrid(newBarriersGrid, p_xLength, p_yLength, false);
    }

    clusterList.forEach(cluster => {
        if (cluster.linked == -1) {
            if (cluster.fullyDigged && !cluster.containADJACENCY) {
                Array.prototype.push.apply(listSpacesClustersBarriered, cluster.spaces);
                cluster.spaces.forEach(space => {
                    newBarriersGrid[space.y][space.x] = true;
                });
            }
        }
    });

    // Setting our "left turners" start points
    newTurningLeftStartPointsList = [];
    p_listNewBARRIER.forEach(space => {
        const x = space.x;
        const y = space.y;

        //Entering by pushing on the inner wall (so we'll be able to turn 90° left and the inner direction will be counted as done)
        if (x > 0 && isPotentiallyAdjacent(x - 1, y)) {
            turningLeftGrid[y][x - 1][DIRECTION.RIGHT] = TASK.TBD;
            newTurningLeftStartPointsList.push({
                x: x - 1,
                y: y,
                dir: DIRECTION.RIGHT
            });
        }
        if (y > 0 && isPotentiallyAdjacent(x, y - 1)) {
            turningLeftGrid[y - 1][x][DIRECTION.DOWN] = TASK.TBD;
            newTurningLeftStartPointsList.push({
                x: x,
                y: y - 1,
                dir: DIRECTION.DOWN
            });
        }
        if (x < p_xLength - 1 && isPotentiallyAdjacent(x + 1, y)) {
            turningLeftGrid[y][x + 1][DIRECTION.LEFT] = TASK.TBD;
            newTurningLeftStartPointsList.push({
                x: x + 1,
                y: y,
                dir: DIRECTION.LEFT
            });
        }
        if (y < p_yLength - 1 && isPotentiallyAdjacent(x, y + 1)) {
            turningLeftGrid[y + 1][x][DIRECTION.UP] = TASK.TBD;
            newTurningLeftStartPointsList.push({
                x: x,
                y: y + 1,
                dir: DIRECTION.UP
            });
        }
    });

    function nextFreeSpaceDirTurningLeft(p_x, p_y, p_pointingDirection) {
        var newSpaceDir = null;
        var i = 0;
        var pointingDirection = p_pointingDirection;
        var newPointingDirection;
        while (i < 4 && (newSpaceDir == null)) {
            i++;
            purgeLog("Looking for turning left ("+p_x+" "+p_y+") : "+pointingDirection);
            newPointingDirection = null;
            if (pointingDirection == DIRECTION.LEFT) {
                newSpaceDir = tryToGoLeft(p_x, p_y);
                newPointingDirection = DIRECTION.UP;
            } else if (pointingDirection == DIRECTION.UP) {
                newSpaceDir = tryToGoUp(p_x, p_y);
                newPointingDirection = DIRECTION.RIGHT;
            } else if (pointingDirection == DIRECTION.RIGHT) {
                newSpaceDir = tryToGoRight(p_x, p_y);
                newPointingDirection = DIRECTION.DOWN;
            } else {
                newSpaceDir = tryToGoDown(p_x, p_y);
                newPointingDirection = DIRECTION.LEFT;
            }
            pointingDirection = newPointingDirection;
        }
        return newSpaceDir
    }

    function tryToGoLeft(p_x, p_y) {
        if ((p_x > 0) && isPotentiallyAdjacent(p_x - 1, p_y)) {
            return {
                x: p_x - 1,
                y: p_y,
                dir: DIRECTION.DOWN
            }
        }
        return null;
    }

    function tryToGoUp(p_x, p_y) {
        if ((p_y > 0) && isPotentiallyAdjacent(p_x, p_y - 1)) {
            return {
                x: p_x,
                y: p_y - 1,
                dir: DIRECTION.LEFT
            }
        }
        return null;
    }

    function tryToGoRight(p_x, p_y) {
        if ((p_x < p_xLength - 1) && isPotentiallyAdjacent(p_x + 1, p_y)) {
            return {
                x: p_x + 1,
                y: p_y,
                dir: DIRECTION.UP
            }
        }
        return null;
    }

    function tryToGoDown(p_x, p_y) {
        if ((p_y < p_yLength - 1) && isPotentiallyAdjacent(p_x, p_y + 1)) {
            return {
                x: p_x,
                y: p_y + 1,
                dir: DIRECTION.RIGHT
            }
        }
        return null;
    }

    // Now let's turn left !
    var spacesLargerThan0 = [];
    var spacesLargerThan1 = [];

    newTurningLeftStartPointsList.forEach(spaceDir => {
        var x = spaceDir.x;
        var y = spaceDir.y;
        var direction = spaceDir.dir;
        var spacesLargerThan0Local = [];
        var spacesLargerThan1Local = [];
        while (turningLeftGrid[y][x][direction] == TASK.TBD) {
            amountGrid[y][x]++;
            turningLog("Now we are doing " + x + " " + y + " (amount : " + amountGrid[y][x] + ")");
            turningLeftGrid[y][x][direction] = TASK.DONE;
            if (amountGrid[y][x] == 2) {
                spacesLargerThan1Local.push({
                    x: x,
                    y: y
                });
            } else {
                spacesLargerThan0Local.push({
                    x: x,
                    y: y
                });
            }
            nextSpaceDir = nextFreeSpaceDirTurningLeft(x, y, direction);
            x = nextSpaceDir.x;
            y = nextSpaceDir.y;
            direction = nextSpaceDir.dir;
        }
        if (spacesLargerThan0Local.length > 0) {
            turningLog("Amount grid : ");
            amountGrid.forEach(row => turningLog(row));
        }
        amountGrid = cleanGridList(amountGrid, spacesLargerThan0Local, 0);
        amountGrid = cleanGridList(amountGrid, spacesLargerThan1Local, 0);
        Array.prototype.push.apply(spacesLargerThan0, spacesLargerThan0Local);
        Array.prototype.push.apply(spacesLargerThan1, spacesLargerThan1Local);
    });

    turningLeftGrid = cleanGridListComplex(turningLeftGrid, spacesLargerThan0, TBD_DIRECTIONS);
    turningLeftGrid = cleanGridListComplex(turningLeftGrid, spacesLargerThan1, TBD_DIRECTIONS);
    newBarriersGrid = cleanGridListComplex(newBarriersGrid, listSpacesClustersBarriered, false);

    // Next step : calculate new list spaces + update ancient ones + make emerge some adjacency spaces.

    function isWorthDiggingLeft(p_x, p_y, p_origin) {
        return (p_x > 0) && isPotentiallyAdjacent(p_x-1, p_y); //&& p_limitArray[p_y][p_x - 1].isAccessible(DIRECTION.LEFT, p_origin);
    }

    function isWorthDiggingUp(p_x, p_y, p_origin) {
        return (p_y > 0) && isPotentiallyAdjacent(p_x, p_y-1); //&& p_limitArray[p_y - 1][p_x].isAccessible(DIRECTION.UP, p_origin);
    }

    function isWorthDiggingRight(p_x, p_y, p_origin) {
        return (p_x < p_xLength - 1) && isPotentiallyAdjacent(p_x + 1, p_y); //&& p_limitArray[p_y][p_x + 1].isAccessible(DIRECTION.RIGHT, p_origin);
    }

    function isWorthDiggingDown(p_x, p_y, p_origin) {
        return (p_y < p_yLength - 1) && isPotentiallyAdjacent(p_x, p_y + 1); //&& p_limitArray[p_y + 1][p_x].isAccessible(DIRECTION.DOWN, p_origin);
    }

    var riskySpacesToCheck = spacesLargerThan1;
    Array.prototype.push.apply(riskySpacesToCheck,p_formerLimitSpaceList);
    var listSpacesConfirmedAdjacency = [];
    var listSpacesLimitsAndTheirLimits = [];
    if (riskySpacesToCheck.length > 0) {
        directionsGrid = restartGrid(directionsGrid, p_xLength, p_yLength, DIRECTION.UNDEFINED);
    }

    riskySpacesToCheck.forEach(space => {
        var xRisk = space.x;
        var yRisk = space.y;
		limitsLog("Starting 'risky' space "+xRisk+","+yRisk+" (adjacency : "+p_function(xRisk, yRisk)+")");
        if (p_function(xRisk, yRisk) != ADJACENCY.NO) { 
            const exploList = {
				//WARNING : the code below is dependent from the labels ! Unfortunately, this seems to be the cost of defining an object with properties...
                L: {
                    spacesExploToDo: [],
                    containADJACENCY: false,
                    linked: DIRECTION.UNDEFINED,
                    id: DIRECTION.LEFT
                },
                U: {
                    spacesExploToDo: [],
                    containADJACENCY: false,
                    linked: DIRECTION.UNDEFINED,
                    id: DIRECTION.UP
                },
                R: {
                    spacesExploToDo: [],
                    containADJACENCY: false,
                    linked: DIRECTION.UNDEFINED,
                    id: DIRECTION.RIGHT
                },
                D: {
                    spacesExploToDo: [],
                    containADJACENCY: false,
                    linked: DIRECTION.UNDEFINED,
                    id: DIRECTION.DOWN
                }
            }; 
			
			//Setting starting points
            if (xRisk > 0 && isPotentiallyAdjacent(xRisk - 1, yRisk)) {
                exploList[DIRECTION.LEFT].spacesExploToDo.push({
                    x: xRisk - 1,
                    y: yRisk,
                    index: DIRECTION.LEFT,
                    origin: DIRECTION.RIGHT
                });
            }
            if (yRisk > 0 && isPotentiallyAdjacent(xRisk, yRisk - 1)) {
                exploList[DIRECTION.UP].spacesExploToDo.push({
                    x: xRisk,
                    y: yRisk - 1,
                    index: DIRECTION.UP,
                    origin: DIRECTION.DOWN
                });
            }
            if ((xRisk < p_xLength - 1) && isPotentiallyAdjacent(xRisk + 1, yRisk)) {
                exploList[DIRECTION.RIGHT].spacesExploToDo.push({
                    x: xRisk + 1,
                    y: yRisk,
                    index: DIRECTION.RIGHT,
                    origin: DIRECTION.LEFT
                });
            }
            if ((yRisk < p_yLength - 1) && isPotentiallyAdjacent(xRisk, yRisk + 1)) {
                exploList[DIRECTION.DOWN].spacesExploToDo.push({
                    x: xRisk,
                    y: yRisk + 1,
                    index: DIRECTION.DOWN,
                    origin: DIRECTION.UP
                });
            }
            directionsGrid[yRisk][xRisk] = DIRECTION.HERE;

            function getActualIndex(p_index) {
                var index = p_index;
                while (exploList[index].linked != DIRECTION.UNDEFINED) {
                    index = exploList[index].linked;
                }
                return index;
            }

            var spaceExplo;
            var directionsWithNOAdjacency = 0;
            var directionsWithAdjacency = 0;
            const directionsArray = [DIRECTION.LEFT, DIRECTION.UP, DIRECTION.RIGHT, DIRECTION.DOWN];
            var i;
            var index,
            myActualIndex,
            newActualIndex;
            var x,
            y,
            origin;
            var stopThere = false;
            var numberNotFullyDiggedDirections,
            numberNotFullyDiggedDirectionsWithAdjacency;
			var spacesMadeDirty = [{x:xRisk,y:yRisk}];
            while (!stopThere) {
                for (i = 0; i < 4; i++) {
                    myActualIndex = getActualIndex(directionsArray[i]);
					/*if (exploList[myActualIndex].containADJACENCY){
						limitsLog("Already detected adjacency for "+myActualIndex);
					}*/
                    if (exploList[myActualIndex].spacesExploToDo.length > 0) {
                        spaceExplo = exploList[myActualIndex].spacesExploToDo.pop();
                        x = spaceExplo.x;
                        y = spaceExplo.y;
                        origin = spaceExplo.origin;
                        index = directionsGrid[y][x];
                        if (index == DIRECTION.UNDEFINED) { //Exploring
                            directionsGrid[y][x] = myActualIndex;
							spacesMadeDirty.push({x:x,y:y});
                            if (p_function(x, y) == ADJACENCY.YES) { 
                                exploList[myActualIndex].containADJACENCY = true;
                            }
                            if (isWorthDiggingLeft(x, y, origin)) {
                                exploList[myActualIndex].spacesExploToDo.push({
                                    x: x - 1,
                                    y: y,
                                    index: myActualIndex,
                                    origin: DIRECTION.RIGHT
                                });
                            }
                            if (isWorthDiggingUp(x, y, origin)) {
                                exploList[myActualIndex].spacesExploToDo.push({
                                    x: x,
                                    y: y - 1,
                                    index: myActualIndex,
                                    origin: DIRECTION.DOWN
                                });
                            }
                            if (isWorthDiggingRight(x, y, origin)) {
                                exploList[myActualIndex].spacesExploToDo.push({
                                    x: x + 1,
                                    y: y,
                                    index: myActualIndex,
                                    origin: DIRECTION.LEFT
                                });
                            }
                            if (isWorthDiggingDown(x, y, origin)) {
                                exploList[myActualIndex].spacesExploToDo.push({
                                    x: x,
                                    y: y + 1,
                                    index: myActualIndex,
                                    origin: DIRECTION.UP
                                });
                            }
                            // A space can explore a neighbor than will then explore the first space, but it will lead to nothing. So no endless loops.
                        } else if (index != DIRECTION.HERE) {
                            newActualIndex = getActualIndex(index);
                            if (newActualIndex != myActualIndex) {
                                //Merging
								limitsLog("Merging "+newActualIndex+" and "+myActualIndex+" in "+x+","+y);
                                const indexReceiver = (exploList[newActualIndex].spacesExploToDo.length > exploList[myActualIndex].spacesExploToDo.length) ? newActualIndex : myActualIndex;
                                const indexGiver = (indexReceiver == newActualIndex) ? myActualIndex : newActualIndex;
                                Array.prototype.push.apply(exploList[indexReceiver].spacesExploToDo, exploList[indexGiver].spacesExploToDo);
                                exploList[indexReceiver].containADJACENCY = exploList[indexReceiver].containADJACENCY || exploList[indexGiver].containADJACENCY;
                                exploList[indexGiver].linked = indexReceiver;
                            }
                        }
                    }
                }
                // Since the accurate size of each cluster don't matter, we should just make sure that (only actual clusters matter)
                // 1) either all clusters are closed
                // 2) or all clusters but one are closed and the unclosed one contains an adjacency
                numberNotFullyDiggedDirections = 0;
                numberNotFullyDiggedDirectionsWithAdjacency = 0;
                for (i = 0; i < 4; i++) {
                    if (exploList[directionsArray[i]].linked == DIRECTION.UNDEFINED) {
                        if (exploList[directionsArray[i]].spacesExploToDo.length != 0) {
                            numberNotFullyDiggedDirections++;
                            if (exploList[directionsArray[i]].containADJACENCY) {
                                numberNotFullyDiggedDirectionsWithAdjacency++;
                            }
                        }
                    }
                }
                stopThere = (numberNotFullyDiggedDirections == 0) || (numberNotFullyDiggedDirections == 1 && numberNotFullyDiggedDirectionsWithAdjacency == 1);
            } // Leaving while loop.
			
			if (spacesMadeDirty.length > 0) {
				limitsLog("Directions grid : ");
				directionsGrid.forEach(row => limitsLog(row));
			}
            directionsGrid = cleanGridList(directionsGrid, spacesMadeDirty, DIRECTION.UNDEFINED);

            // For this space : 1) create a new limit (TODO : On considère que c'est une nouvelle limite !) 2) put an adjacency if at least 2 branches contain one.

            var adjacencyLimit = new AdjacencyLimit([]);
            var sideNumberWithAdjacency = 0;
            for (i = 0; i < 4; i++) {
                if (exploList[directionsArray[i]].linked == DIRECTION.UNDEFINED) {
                    adjacencyLimit.createSideIfNeeded(directionsArray[i]);
                    if (exploList[directionsArray[i]].containADJACENCY) {
                        sideNumberWithAdjacency++;
                    }
                } else {
                    adjacencyLimit.bindDirections(directionsArray[i], getActualIndex(directionsArray[i]));
                }
            }
			
			// If this is a limit for the former list, the newly computed limit may be equal to the former one, hence it's not worth adding it. Let's give a check.
			if (!adjacencyLimit.equals(p_limitArray[space.y][space.x])){	 //TODO warning, ça force la convention de nommage "formerValue"		
				listSpacesLimitsAndTheirLimits.push({
					x: space.x,
					y: space.y,
					limit: adjacencyLimit
				});	
				// p_limitArray[space.y][space.x] = adjacencyLimit; TODO et merd.... ça modifie le tableau passé en paramètre ! La prochaine fois je me contenterai d'une grille annexe semblable à amountGrid,turningLeftGrid et compagnie...
			}
			
			//Make sure we add only NEW adjacency spaces, because this will be passed as a list of new events (and the lists should be empty if there is nothing to report)
            if (sideNumberWithAdjacency >= 2 && (p_function(space.x,space.y) != ADJACENCY.YES)) { 
                listSpacesConfirmedAdjacency.push({
                    x: space.x,
                    y: space.y
                });
            }
			limitsLog(space.x+","+space.y+" : created limit "+adjacencyLimit.toString()+" ; sides with Adjacency : "+sideNumberWithAdjacency);
        }
    });

    return {
        success: true,
        newADJACENCY: listSpacesConfirmedAdjacency,
        newBARRIER: listSpacesClustersBarriered,
        newLimits: listSpacesLimitsAndTheirLimits
    }
}




//----------------------
//Debug room !

function purgeLog(p_message){
	//console.log("Purging - "+p_message);
}

function turningLog(p_message){
	//console.log("Turning - "+p_message);
}

function limitsLog(p_message){
	//console.log("Limits - "+p_message);
}