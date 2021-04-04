const ADJACENCY = {
    YES: 1,
    NO: 0,
    UNDEFINED: -1
};

DIRECTION.HERE = 'H';

const TASK = {
    TBD: 0,
    DONE: 1
};
const UNDEFINED_INDEX = -1;

const TBD_DIRECTIONS = {
    d: TASK.TBD, 
    l: TASK.TBD,
    u: TASK.TBD,
    r: TASK.TBD
};

var turningLeftArray = null;
var indexClustersGrid = null;
var amountStepsArray = null;
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

function restartGridTBD(p_array, p_xLength, p_yLength) {
    if ((p_array == null) || (p_yLength != p_array.length) || (p_xLength != p_array[0].length)) {
        p_array = [];
        var x;
        for (var y = 0; y < p_yLength; y++) {
            p_array.push([]);
            for (x = 0; x < p_xLength; x++) {
                p_array[y].push({
                    l: TASK.TBD,
                    u: TASK.TBD,
                    r: TASK.TBD,
                    d: TASK.TBD
                }); // A copy of the item is required here
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

function cleanGridListTBD(p_array, p_list) {
    p_list.forEach(space => {
        p_array[space.y][space.x] = {
            l: TASK.TBD,
            u: TASK.TBD,
            r: TASK.TBD,
            d: TASK.TBD
        }
        // Même remarque que dans la version "non naturelle" de restartGrid (aka restartGridTBD sauf si changement de nom)
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
	
	// Not optimal unfortunately but if anyone has better...
	function neighborExists(p_x, p_y, p_dir) {
		switch (p_dir) {
			case DIRECTION.LEFT : return p_x > 0;
			case DIRECTION.UP : return p_y > 0;
			case DIRECTION.RIGHT : return p_x <= p_xLength - 2;
			case DIRECTION.DOWN : return p_y <= p_yLength - 2;
		}
	}
	
	// Anyway let's go !
	amountStepsArray = restartGrid(amountStepsArray, p_xLength, p_yLength, 0);
    indexClustersGrid = restartGrid(indexClustersGrid, p_xLength, p_yLength, UNDEFINED_INDEX);
    turningLeftArray = restartGridTBD(turningLeftArray, p_xLength, p_yLength);

    //Create "clusters"
    var clusterList = [];
    var clusterIndex = 0;
    var spacesToCheck = [];
	
    /**
		Creates clusters for each spaces that are "adjacent to a newly entered 'adjacency_no' space"
    */
    function testAdjacentToADJACENCY_NO(p_xx, p_yy) {
        const value = p_function(p_xx, p_yy);
        if ((value != ADJACENCY.NO) && (indexClustersGrid[p_yy][p_xx] == UNDEFINED_INDEX)) {
            indexClustersGrid[p_yy][p_xx] = clusterIndex;
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
            clusterIndex++;
        }
    }

    p_listNewBARRIER.forEach(space => {
        const x = space.x;
        const y = space.y;
		KnownDirections.forEach(dir => {
			if (neighborExists(x, y, dir)) {
				testAdjacentToADJACENCY_NO(x + DeltaX[dir], y + DeltaY[dir]);
			}
		});
    });
	/**
	Now, clusterList should be initialized as a list of clusters of size 1 ('spaces' field), of unique indexes and they are not linked to another cluster (see below)
	spacesToCheck should have the list of spaces contained in clusters
	*/

    var space, x, y, clusterIndex;

    /**
    Returns the cluster index that the one passed as argument depends upon and which depends on no one else. (if ClusterList == [0, 0, 2, 1, 2], dependance chains are : 3 -> 1 -> 0, 4 -> 2)
     */
    function actualClusterIndex(p_clusterIndex) {
        while (clusterList[p_clusterIndex].linked != UNDEFINED_INDEX) {
            p_clusterIndex = clusterList[p_clusterIndex].linked;
        }
        return p_clusterIndex;
    }

	/**
	For each space in "spacesToCheck", checks all (up to 4) spaces around : if an around space is not closed, 
	either join it to its cluster (modifying indexClustersGrid and an entry of clusterList) or merge two clusters together according to its index (the receiver cluster is the one which is already bigger - 
	only "unlinked" clusters + their indexes are taken into consideration for merging, all linked clusters have invalid information
	
	*/
    function checkSpace(p_spacesToCheck, p_xx, p_yy, p_clusterIndexOrigin) {
        var value = p_function(p_xx, p_yy);
        if (value != ADJACENCY.NO) {
            var actualIndex = actualClusterIndex(p_clusterIndexOrigin);
            var clusterIndexNewSpace = indexClustersGrid[p_yy][p_xx];
            if (clusterIndexNewSpace == UNDEFINED_INDEX) {
				// Adding space to the cluster
                indexClustersGrid[p_yy][p_xx] = actualIndex;
                if (value == ADJACENCY.YES) {
                    clusterList[actualIndex].containADJACENCY = true;
                }
                clusterList[actualIndex].spaces.push({
                    x: p_xx,
                    y: p_yy
                });
                p_spacesToCheck.push({
                    x: p_xx,
                    y: p_yy
                });
            } else {
                purgeLog("checkSpace - merge (may be outdated indexes) - (" + p_xx + "," + p_yy + ") " + p_clusterIndexOrigin + " <-> " + clusterIndexNewSpace);
                var secondActualIndex = actualClusterIndex(clusterIndexNewSpace);
                var indexReceiver = actualIndex;
                if (actualIndex != secondActualIndex) {
                    // Merging two clusters
                    indexReceiver = (clusterList[actualIndex].spaces.length > clusterList[secondActualIndex].spaces.length) ? actualIndex : secondActualIndex;
                    var indexGiver = (indexReceiver == secondActualIndex) ? actualIndex : secondActualIndex;
                    Array.prototype.push.apply(clusterList[indexReceiver].spaces, clusterList[indexGiver].spaces);
                    clusterList[indexReceiver].containADJACENCY = clusterList[indexReceiver].containADJACENCY || clusterList[indexGiver].containADJACENCY;
                    clusterList[indexGiver].linked = indexReceiver;
                }
            }
        }
		return p_spacesToCheck;
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
		// For each spaces in spacesToCheck, control the neighboring spaces by either adding it to the current cluster or future spaces to check or by merging both clusters.
        for (i = 0; i < spacesToCheck.length; i++) {
            space = spacesToCheck[i];
            x = space.x;
            y = space.y;
            clusterIndex = actualClusterIndex(indexClustersGrid[y][x]);
			KnownDirections.forEach(dir => {
				if (neighborExists(x, y, dir)) {
					futureSpacesToCheck = checkSpace(futureSpacesToCheck, x + DeltaX[dir], y + DeltaY[dir], clusterIndex);
				}
			});
        }
		// Right now, futureSpacesToCheck contains spaces that were adjacent to the previous "spacesToCheck", not closed, and didn't belong to a cluster before the for loop.
        spacesToCheck = futureSpacesToCheck;
        // Now, check all clusters 
		// Declare failure if a cluster contains adjacency and another cluser with adjacency is fully digged
		// Declare a cluster fully digged if it doesn't have any of its spaces in futureSpacesToCheck
		
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
			// It's quite rare, but sometimes, two unlinked clusters can become fully digged at the same time (e.g. "fully digged" remain true at the same pasage in this loop) 
			// This was the case for puzzle 678, and the problem was that the failure check was in this "if (futureSpacesToCheck.length > 0)" block, which made no sense after all, despite the fact that the problem can indeed be detected without all the spaces checked.
            moreToDig = ((numberNonFullyDiggedClusters > 1) || (numberNonFullyDiggedClustersWithoutADJACENCY > 0));
        } else {
            moreToDig = false;
        }
    }
	
	// Check if among all clusters, failure is not to be declared (see conditions above)
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
	if (clusterList.length != 0) {
        newBarriersGrid = restartGrid(newBarriersGrid, p_xLength, p_yLength, false);
    }
	
    var listSpacesClustersBarriered = [];
    var numberOfClustersWithAdjacency = 0;

	// Method : tests if an EXISTING space is "potentially adjacent", ie it's not a new-to-be closed space and it is either undecided and open.
    function isPotentiallyAdjacent(p_x, p_y) {
        return ((!newBarriersGrid[p_y][p_x]) && (p_function(p_x, p_y) != ADJACENCY.NO));
    }
	
	// 
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
    // Entering by pushing on the inner wall (so we'll be able to turn 90° left and the inner direction will be counted as done)
    newTurningLeftStartPointsList = [];
    p_listNewBARRIER.forEach(space => {
        const x = space.x;
        const y = space.y;
		KnownDirections.forEach(dir => {
			if (neighborExists(x, y, dir)) {
				const xx = x + DeltaX[dir];
				const yy = y + DeltaY[dir];
				if (isPotentiallyAdjacent(xx, yy)) {
					turningLeftArray[yy][xx][OppositeDirection[dir]] = TASK.TBD;
					newTurningLeftStartPointsList.push({
						x : xx,
						y : yy,
						dir: TurningLeftDirection[dir]
					});
				}
			}
		});
    });

	// Returns the next "free space and direction when we are turning left"
    function nextFreeSpaceDirTurningLeft(p_x, p_y, p_pointingDirection) {
        var newSpaceDir = null;
        var i = 0;
        var pointingDirection = p_pointingDirection;
        var newPointingDirection;
        while (i < 4 && (newSpaceDir == null)) {
            i++;
            purgeLog("Looking for turning left (" + p_x + " " + p_y + ") : " + pointingDirection);
			if (neighborExists(p_x, p_y, pointingDirection) && isPotentiallyAdjacent(p_x + DeltaX[pointingDirection], p_y + DeltaY[pointingDirection])) {
				return {
					x : p_x + DeltaX[pointingDirection],
					y : p_y + DeltaY[pointingDirection],
					dir : TurningLeftDirection[pointingDirection]
				}
			}
			pointingDirection = TurningRightDirection[pointingDirection];		
        }
        return null;
    }

    // Now let's turn left for each "starting point". Spaces that are run twice ought to contain limits.
    var spacesWalkedGlobal = [];
	var spacesWithLimits = [];

    newTurningLeftStartPointsList.forEach(spaceDir => {
        var x = spaceDir.x;
        var y = spaceDir.y;
        var direction = spaceDir.dir;
        var spacesWalkedLocal = [];
        var spacesMultiWalkedLocal = []; 
        while (turningLeftArray[y][x][direction] == TASK.TBD) {
            amountStepsArray[y][x]++;
            turningLog("Now we are doing " + x + " " + y + " (amount of steps : " + amountStepsArray[y][x] + ")");
            turningLeftArray[y][x][direction] = TASK.DONE;
            if (amountStepsArray[y][x] == 2) {
                spacesMultiWalkedLocal.push({
                    x: x,
                    y: y
                }); //TODO on pourrait fabriquer des limites ici, non ? (cf. ci-dessous avec les directions unies.)
            } else if (amountStepsArray[y][x] == 1) {
                spacesWalkedLocal.push({
                    x: x,
                    y: y
                });
            }
            nextSpaceDir = nextFreeSpaceDirTurningLeft(x, y, direction);
            x = nextSpaceDir.x;
            y = nextSpaceDir.y;
            direction = nextSpaceDir.dir;
        }
        if (spacesWalkedLocal.length > 0) {
            turningLog("Amount grid : ");
            amountStepsArray.forEach(row => turningLog(row));
        }
        amountStepsArray = cleanGridList(amountStepsArray, spacesWalkedLocal, 0);
        Array.prototype.push.apply(spacesWalkedGlobal, spacesWalkedLocal);
        Array.prototype.push.apply(spacesWithLimits, spacesMultiWalkedLocal);
		turningLeftArray = cleanGridListTBD(turningLeftArray, spacesMultiWalkedLocal); // TODO ligne redondante avec le nouveau rôle de spacesWalkedGlobal ?
    });

    turningLeftArray = cleanGridListTBD(turningLeftArray, spacesWalkedGlobal);
    newBarriersGrid = cleanGridList(newBarriersGrid, listSpacesClustersBarriered, false); // TODO pourquoi cette ligne ?

    // Next step : calculate new list spaces + update ancient ones + make emerge some adjacency spaces.

	p_formerLimitSpaceList.forEach(space => {
		if (p_function(space.x, space.y) != ADJACENCY.NO) {
			spacesWithLimits.push(space);
		}
	});
	
    var listSpacesConfirmedAdjacency = [];
    var listSpacesLimitsAndTheirLimits = [];
    if (spacesWithLimits.length > 0) {
        directionsGrid = restartGrid(directionsGrid, p_xLength, p_yLength, DIRECTION.UNDECIDED);
    }
	
	function isWorthDigging(p_x, p_y, p_origin, p_direction) {
		return (neighborExists(p_x, p_y, p_direction) && isPotentiallyAdjacent(p_x + DeltaX[p_direction], p_y + DeltaY[p_direction])); // && p_limitArray[p_y + DeltaY[p_direction]][p_x + DeltaX[p_direction]].isAccessible(p_direction, p_origin);
	}

	// spacesWithLimits = open or undecided spaces that the "turning left" walks have crossed twice or more OR that were former limits. 
    spacesWithLimits.forEach(space => {
        var xRisk = space.x;
        var yRisk = space.y;
        limitsLog("Starting 'risky' space " + xRisk + "," + yRisk + " (adjacency : " + p_function(xRisk, yRisk) + ")");
		const exploList = [];
		KnownDirections.forEach(dir => {
			exploList[dir] = {
				spacesExploToDo: [],
				containADJACENCY: false,
				linked: DIRECTION.UNDECIDED,
			}	
			if (neighborExists(xRisk, yRisk, dir) && isPotentiallyAdjacent(xRisk + DeltaX[dir], yRisk + DeltaY[dir])) {
				exploList[dir].spacesExploToDo.push({
					x : xRisk + DeltaX[dir],
					y : yRisk + DeltaY[dir],
					index : dir,
					origin : OppositeDirection[dir]
				});
			}
		});
		
		directionsGrid[yRisk][xRisk] = DIRECTION.HERE;

		function getActualIndex(p_index) {
			var index = p_index;
			while (exploList[index].linked != DIRECTION.UNDECIDED) {
				index = exploList[index].linked;
			}
			return index;
		}

		var spaceExplo;
		var directionsWithNOAdjacency = 0;
		var directionsWithAdjacency = 0;
		var index, myActualIndex, newActualIndex;
		var x, y, origin;
		var stopThere = false;
		var numberNotFullyDiggedDirections, numberNotFullyDiggedDirectionsWithAdjacency;
		var spacesMadeDirty = [{
				x: xRisk,
				y: yRisk
			}
		];
		while (!stopThere) {
			KnownDirections.forEach(dir0 => {
				myActualIndex = getActualIndex(dir0);
				if (exploList[myActualIndex].spacesExploToDo.length > 0) {
					spaceExplo = exploList[myActualIndex].spacesExploToDo.pop();
					x = spaceExplo.x;
					y = spaceExplo.y;
					origin = spaceExplo.origin;
					index = directionsGrid[y][x];
					if (index == DIRECTION.UNDECIDED) { //Exploring
						directionsGrid[y][x] = myActualIndex;
						spacesMadeDirty.push({
							x: x,
							y: y
						});
						if (p_function(x, y) == ADJACENCY.YES) {
							exploList[myActualIndex].containADJACENCY = true;
						}
						KnownDirections.forEach(dir => {							
							if (isWorthDigging(x, y, origin, dir)) {
								exploList[myActualIndex].spacesExploToDo.push({
									x : x + DeltaX[dir],
									y : y + DeltaY[dir],
									index : myActualIndex,
									origin : OppositeDirection[dir]
								});
							}	
						});
						// A space can explore a neighbor than will then explore the first space, but it will lead to nothing. So no endless loops.
					} else if (index != DIRECTION.HERE) {
						newActualIndex = getActualIndex(index);
						if (newActualIndex != myActualIndex) {
							//Merging
							limitsLog("Merging " + newActualIndex + " and " + myActualIndex + " in " + x + "," + y);
							const indexReceiver = (exploList[newActualIndex].spacesExploToDo.length > exploList[myActualIndex].spacesExploToDo.length) ? newActualIndex : myActualIndex;
							const indexGiver = (indexReceiver == newActualIndex) ? myActualIndex : newActualIndex;
							Array.prototype.push.apply(exploList[indexReceiver].spacesExploToDo, exploList[indexGiver].spacesExploToDo);
							exploList[indexReceiver].containADJACENCY = exploList[indexReceiver].containADJACENCY || exploList[indexGiver].containADJACENCY;
							exploList[indexGiver].linked = indexReceiver;
						}
					}
				}
			});
			// Since the accurate size of each cluster don't matter, we should just make sure in order to stop explorations that (only actual clusters matter)
			// 1) either all clusters are closed
			// 2) or all clusters but one are closed and the unclosed one contains an adjacency
			numberNotFullyDiggedDirections = 0;
			numberNotFullyDiggedDirectionsWithAdjacency = 0;
			KnownDirections.forEach(dir => {
				if (exploList[dir].linked == DIRECTION.UNDECIDED) {
					if (exploList[dir].spacesExploToDo.length != 0) {
						numberNotFullyDiggedDirections++;
						if (exploList[dir].containADJACENCY) {
							numberNotFullyDiggedDirectionsWithAdjacency++;
						}
					}
				}
			});
			stopThere = (numberNotFullyDiggedDirections == 0) || (numberNotFullyDiggedDirections == 1 && numberNotFullyDiggedDirectionsWithAdjacency == 1);
		} // Leaving while loop.

		if (spacesMadeDirty.length > 0) {
			limitsLog("Directions grid : ");
			directionsGrid.forEach(row => limitsLog(row));
		}
		directionsGrid = cleanGridList(directionsGrid, spacesMadeDirty, DIRECTION.UNDECIDED);

		// For this space : 1) create a new limit (TODO : On considère que c'est une nouvelle limite !) 2) put an adjacency if at least 2 branches contain one.

		var adjacencyLimit = new AdjacencyLimit([]);
		var sideNumberWithAdjacency = 0;
		KnownDirections.forEach(dir => {
			if (exploList[dir].linked == DIRECTION.UNDECIDED) {
				adjacencyLimit.createSideIfNeeded(dir);
				if (exploList[dir].containADJACENCY) {
					sideNumberWithAdjacency++;
				}
			} else {
				adjacencyLimit.bindDirections(dir, getActualIndex(dir));
			}
		});

		// If this is a limit for the former list, the newly computed limit may be equal to the former one, hence it's not worth adding it. Let's give a check.
		if (!adjacencyLimit.equals(p_limitArray[space.y][space.x])) { //TODO warning, ça force la convention de nommage "formerValue"
			listSpacesLimitsAndTheirLimits.push({
				x: space.x,
				y: space.y,
				limit: adjacencyLimit
			});
			// p_limitArray[space.y][space.x] = adjacencyLimit; TODO et merd.... ça modifie le tableau passé en paramètre ! La prochaine fois je me contenterai d'une grille annexe semblable à amountStepsArray,turningLeftArray et compagnie...
		}

		//Make sure we add only NEW adjacency spaces, because this will be passed as a list of new events (and the lists should be empty if there is nothing to report)
		if (sideNumberWithAdjacency >= 2 && (p_function(space.x, space.y) != ADJACENCY.YES)) {
			listSpacesConfirmedAdjacency.push({
				x: space.x,
				y: space.y
			});
		}
		limitsLog(space.x + "," + space.y + " : created limit " + adjacencyLimit.toString() + " ; sides with Adjacency : " + sideNumberWithAdjacency);
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

function purgeLog(p_message) {
    //console.log("Purging - "+p_message);
}

function turningLog(p_message) {
    //console.log("Turning - "+p_message);
}

function limitsLog(p_message) {
    //console.log("Limits - "+p_message);
}
