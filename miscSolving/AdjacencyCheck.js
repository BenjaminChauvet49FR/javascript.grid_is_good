const ADJACENCY = {
    YES : 2,
    NO : 0,
    UNDECIDED : 1
};
const LabelAdjacency = ['-', 'X', 'O'];

DIRECTION.HERE = 5;

const TASK = {
    TBD : 0,
    DONE : 1
};

const UNDEFINED_INDEX = -1;

function restartArray(p_array, p_value) {
    if ((!p_array) || (adjacencyCheckManager.yLength != p_array.length) || (adjacencyCheckManager.xLength != p_array[0].length)) {
        p_array = generateValueArray(adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, p_value);
    }
    return p_array;
}

function restartArrayTBD(p_array) {
    if ((!p_array) || (adjacencyCheckManager.yLength != p_array.length) || (adjacencyCheckManager.xLength != p_array[0].length)) {
		p_array = generateFunctionValueArray(adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, function(){return [TASK.TBD, TASK.TBD, TASK.TBD, TASK.TBD]});
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
        p_array[space.y][space.x] = [TASK.TBD, TASK.TBD, TASK.TBD, TASK.TBD];
    });
    return p_array;
}

// adjacencyCheckManager.functionAdjacency = function from (x, y) to ADJACENCY.YES, NO or UNDECIDED
var adjacencyCheckManager = {}
function setupAdjacencyCheck(p_xLength, p_yLength, p_functionAdjacency) {
	adjacencyCheckManager.xLength = p_xLength;
	adjacencyCheckManager.yLength = p_yLength;
	adjacencyCheckManager.functionAdjacency = p_functionAdjacency;
	adjacencyCheckManager.amountStepsArray = restartArray(adjacencyCheckManager.amountStepsArray, 0);
	//lastWalkDirectionArray = restartArray(lastWalkDirectionArray, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, null); limit detection in left walk
    adjacencyCheckManager.indexClustersArray = restartArray(adjacencyCheckManager.indexClustersArray, UNDEFINED_INDEX);
    adjacencyCheckManager.turningLeftArray = restartArrayTBD(adjacencyCheckManager.turningLeftArray);
	adjacencyCheckManager.tubesArray = restartArray(adjacencyCheckManager.tubesArray, false);	
	adjacencyCheckManager.newBarriersArray = restartArray(adjacencyCheckManager.newBarriersArray, false); 
	adjacencyCheckManager.directionsArray = restartArray(adjacencyCheckManager.directionsArray, DIRECTION.UNDECIDED); 
}


// ------------------
// Utilitary

// Method : tests if an EXISTING space is "potentially adjacent", ie it's not a new-to-be closed space and it is either undecided and open.
function isNotMeantClosed(p_x, p_y) {
	return ((!adjacencyCheckManager.newBarriersArray[p_y][p_x]) && (adjacencyCheckManager.functionAdjacency(p_x, p_y) != ADJACENCY.NO));
}

/*
THE function to eliminate closed clusters. However, the grid must have at least one ADJACENCY.YES placed to use it, otherwise there would be no use in detecting clusters and you don't know which ones to close.
p_listNewADJACENCY p_listNewBARRIER are {x,y} positions of ADJACENCY.YES and ADJACENCY.NO spaces since the last time it was checked.
*/
function adjacencyCheck(p_listNewBARRIER, p_limitArray, p_formerLimitSpaceList) {
	// ----------------
	// Part 1 : clusters closed AND check absence of separations

    //Create "clusters"
    var clusterList = [];
    var clusterIndex = 0;
    var spacesToCheck = [];
	
    /**
		Creates clusters for each spaces that are "adjacent to a newly entered 'adjacency_no' space"
    */
    function testAdjacentToADJACENCY_NO(p_xx, p_yy) {
        const value = adjacencyCheckManager.functionAdjacency(p_xx, p_yy);
        if ((value != ADJACENCY.NO) && (adjacencyCheckManager.indexClustersArray[p_yy][p_xx] == UNDEFINED_INDEX)) {
            adjacencyCheckManager.indexClustersArray[p_yy][p_xx] = clusterIndex;
            spacesToCheck.push({x: p_xx,y: p_yy});
            clusterList.push({
                spaces: [{x: p_xx, y: p_yy}],
                containADJACENCY : (value == ADJACENCY.YES),
                linked : -1,
				linking : [],
				index : clusterIndex
            });
            clusterIndex++;
        }
    }
	
	// 1.0 : initialize spaces "next to newly adjacency_no spaces"
    p_listNewBARRIER.forEach(space => {
        const x = space.x;
        const y = space.y;
		KnownDirections.forEach(dir => {
			if (neighborExists(x, y, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, dir)) {
				testAdjacentToADJACENCY_NO(x + DeltaX[dir], y + DeltaY[dir]);
			}
		});
    });
	/**
	Now, clusterList should be initialized as a list of clusters of size 1 ('spaces' field), of unique indexes and they are not linked to another cluster (see below)
	spacesToCheck should have the list of spaces contained in clusters
	*/

    var space, x, y, clusterIndex;

	function getActualClusterIndexFromSpace(p_space) {
		return actualClusterIndex(adjacencyCheckManager.indexClustersArray[p_space.y][p_space.x])
	}

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
	either join it to its cluster (modifying adjacencyCheckManager.indexClustersArray and an entry of clusterList) or merge two clusters together according to its index (the receiver cluster is the one which is already bigger - 
	only "unlinked" clusters + their indexes are taken into consideration for merging, all linked clusters have invalid information
	*/
    function checkSpace(p_spacesToCheck, p_xx, p_yy, p_clusterIndexOrigin) {
        var value = adjacencyCheckManager.functionAdjacency(p_xx, p_yy);
        if (value != ADJACENCY.NO) {
            // var actualIndex = actualClusterIndex(p_clusterIndexOrigin);
            var clusterIndexNewSpace = adjacencyCheckManager.indexClustersArray[p_yy][p_xx];
            if (clusterIndexNewSpace == UNDEFINED_INDEX) {
				// Adding space to the cluster
                adjacencyCheckManager.indexClustersArray[p_yy][p_xx] = p_clusterIndexOrigin;
                if (value == ADJACENCY.YES) {
                    clusterList[actualClusterIndex(p_clusterIndexOrigin)].containADJACENCY = true;
                }
                clusterList[p_clusterIndexOrigin].spaces.push({x: p_xx, y: p_yy});
                p_spacesToCheck.push({x: p_xx, y: p_yy});
            } else {
                // purgeLog("checkSpace - merge (may be outdated indexes) - (" + p_xx + "," + p_yy + ") " + p_clusterIndexOrigin + " <-> " + clusterIndexNewSpace);
                var actualIndex = actualClusterIndex(p_clusterIndexOrigin);
				var secondActualIndex = actualClusterIndex(clusterIndexNewSpace);
                if (actualIndex != secondActualIndex) {
                    // Merging two clusters
                    const indexReceiver = (clusterList[actualIndex].spaces.length > clusterList[secondActualIndex].spaces.length) ? actualIndex : secondActualIndex;
                    const indexGiver = (indexReceiver == secondActualIndex) ? actualIndex : secondActualIndex;
                    clusterList[indexGiver].linked = indexReceiver;
                    clusterList[indexReceiver].linking.push(indexGiver);
                    clusterList[actualClusterIndex(indexReceiver)].containADJACENCY = (clusterList[actualClusterIndex(indexReceiver)].containADJACENCY || clusterList[indexReceiver].containADJACENCY || clusterList[indexGiver].containADJACENCY);
					// What if we link 3 to 2 but 2 is already linked to 1
				}
            }
        }
		return p_spacesToCheck;
    }

    var futureSpacesToCheck;
    var moreToDig = (spacesToCheck.length > 0);
    var actualIndexCluster0,
    i;
    var failureClustersWithAdjacency = false;
	// 1.1 check the spaces "next to newly adjacency_no spaces" : dig differents clusters of undecided/open spaces
    while (spacesToCheck.length > 0 && moreToDig && !failureClustersWithAdjacency) {
        futureSpacesToCheck = [];
		// For each spaces in spacesToCheck, control the neighboring spaces by either adding it to the current cluster or future spaces to check or by merging both clusters.
        for (i = 0; i < spacesToCheck.length; i++) {
            space = spacesToCheck[i];
            x = space.x;
            y = space.y;
            clusterIndex = actualClusterIndex(adjacencyCheckManager.indexClustersArray[y][x]);
			KnownDirections.forEach(dir => {
				if (neighborExists(x, y, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, dir)) {
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
		var numberNonFullyDiggedClusters = 0;
		var numberNonFullyDiggedClustersWithoutADJACENCY = 0;
		moreToDig = false;
		for (var i = 0 ; i < futureSpacesToCheck.length ; i++) {
			space = futureSpacesToCheck[i];
			var actualCluster = getActualClusterIndexFromSpace(space);
			if (clusterList[actualCluster].fullyDigged) {
				clusterList[actualCluster].fullyDigged = false;
				numberNonFullyDiggedClusters++;
				if (!clusterList[actualCluster].containADJACENCY) {
					numberNonFullyDiggedClustersWithoutADJACENCY++;
				}
			}
			moreToDig = ((numberNonFullyDiggedClusters > 1) || (numberNonFullyDiggedClustersWithoutADJACENCY > 0));
			// It's quite rare, but sometimes, two unlinked clusters can become fully digged at the same time (e.g. "fully digged" remain true at the same pasage in this loop) 
			// This was the case for puzzle 678, and the problem was that the failure check was in this "if (futureSpacesToCheck.length > 0)" block, which made no sense after all, despite the fact that the problem can indeed be detected without all the spaces checked.
			if (moreToDig) {
				break;
			}
		}
    }
	
	// 1.2 make sure all the clusters with undecided spaces join together
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
        adjacencyCheckManager.indexClustersArray = cleanGridList(adjacencyCheckManager.indexClustersArray, cluster.spaces, UNDEFINED_INDEX);
    });

    if (failureClustersWithAdjacency) {
        return {
            success: false
        }
    }

	// ----------------
	// Part 2 : turn left policy
    //List the new limit spaces, e.g. the ones that are crossed more than once when
    //we walk around the barrier spaces (starting with the new barriers) and turn left when possible (like a bug (or paramecium ?) in Chip's Challenge).
	if (clusterList.length != 0) {
        adjacencyCheckManager.newBarriersArray = restartArray(adjacencyCheckManager.newBarriersArray, false);
    }
	
    var listSpacesClustersBarriered = [];
    clusterList.forEach(cluster => {
        if (cluster.linked == -1) {
            if (cluster.fullyDigged && !cluster.containADJACENCY) {
                Array.prototype.push.apply(listSpacesClustersBarriered, cluster.spaces);
                cluster.spaces.forEach(space => {
                    adjacencyCheckManager.newBarriersArray[space.y][space.x] = true;
                });
            }
        }
    });

	// 2.0 : setting our "left turners" start points
    // Entering by pushing on the inner wall (so we'll be able to turn 90° left and the inner direction will be counted as done)
    newTurningLeftStartPointsList = [];
    p_listNewBARRIER.forEach(space => {
        const x = space.x;
        const y = space.y;
		KnownDirections.forEach(dir => {
			if (neighborExists(x, y, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, dir)) {
				const xx = x + DeltaX[dir];
				const yy = y + DeltaY[dir];
				if (isNotMeantClosed(xx, yy)) {
				//if (adjacencyCheckManager.functionAdjacency(p_x, p_y) == ADJACENCY.UNDECIDED && (!adjacencyCheckManager.newBarriersArray[p_y][p_x])) { // Only spaces "that ain't decided yet
					adjacencyCheckManager.turningLeftArray[yy][xx][OppositeDirection[dir]] = TASK.TBD;
					newTurningLeftStartPointsList.push({
						x : xx,
						y : yy,
						dir: TurningLeftDirection[dir]
					});
				}
			}
		});
    });

	// Returns the next "free space when we are turning left an direction we are gonna point towards" (we will point left immediately)
	// For tests only : solver.adjacencyLimitGrid[0][3].isAccessible(DIRECTION.LEFT, DIRECTION.DOWN)
    function nextFreeSpaceDirTurningLeft(p_x, p_y, p_pointingDirection, p_originDirection) {
        var newSpaceDir = null;
        var i = 0;
        var pointingDirection = p_pointingDirection;
        var newPointingDirection;
        while (i < 4 && (newSpaceDir == null)) {
            i++;
            purgeLog("Looking for turning left (" + p_x + " " + p_y + ") : " + pointingDirection);
			if (p_limitArray[p_y][p_x].isAccessible(pointingDirection, p_originDirection)) { // This row is (partially) the reason of existing of limits. But are they that useful after all ?
				if (neighborExists(p_x, p_y, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, pointingDirection) && isNotMeantClosed(p_x + DeltaX[pointingDirection], p_y + DeltaY[pointingDirection])) {
					return {
						x : p_x + DeltaX[pointingDirection],
						y : p_y + DeltaY[pointingDirection],
						dir : TurningLeftDirection[pointingDirection]
					}
				}	
			}	
			pointingDirection = TurningRightDirection[pointingDirection];		
        }
        return null; // Null may happen if the open space is completely alone !
    }

	// 2.1 Apply turn left policy.
    // Now let's turn left for each "starting point". Spaces that are run twice ought to contain limits.
    var spacesWalkedGlobal = [];
	var spacesWithLimits = [];
    newTurningLeftStartPointsList.forEach(spaceDir => {
        var x = spaceDir.x;
        var y = spaceDir.y;
        var direction = spaceDir.dir;
        var spacesWalkedLocal = [];
        var spacesMultiWalkedLocal = []; 
		//var spacesMultiWalkedAloneDir = []; "limit detection in left walk"
		var origin = DIRECTION.HERE;
		var lwd;
		numberSteps = 0;
        while (adjacencyCheckManager.turningLeftArray[y][x][direction] == TASK.TBD) {
            adjacencyCheckManager.amountStepsArray[y][x]++;
			numberSteps++;
            turningLog("Now we are doing " + x + " " + y + " (amount of steps : " + adjacencyCheckManager.amountStepsArray[y][x] + ")");
            adjacencyCheckManager.turningLeftArray[y][x][direction] = TASK.DONE;
            if (adjacencyCheckManager.amountStepsArray[y][x] == 2) {
                spacesMultiWalkedLocal.push({
                    x: x,
                    y: y
                }); //TODO potential improvement (though not great) : if we enter a space the same way we left it, mark it as "alone" for limit check. "limit detection in left walk"
				/*lwd = lastWalkDirectionArray[y][x];
				if ((lwd != null) && (lwd == TurningLeftDirection[direction])) { // If the "direction when we last walked from this space" is different from the "direction we just walked this space into"
					spacesMultiWalkedAloneDir.push({
						x : x + DeltaX[direction],
						y : y + DeltaY[direction],
						direction : lwd
					})
				}*/ 
            } else if (adjacencyCheckManager.amountStepsArray[y][x] == 1) {
                spacesWalkedLocal.push({
                    x: x,
                    y: y
                });
            }
            nextSpaceDir = nextFreeSpaceDirTurningLeft(x, y, direction, origin);
			//lastWalkDirectionArray[y][x] = TurningRightDirection[nextSpaceDir.dir];
			if (nextSpaceDir != null) { // Case of a single open space surrounded by closed spaces. Happens in the pass of some puzzles.
				x = nextSpaceDir.x;
				y = nextSpaceDir.y;
				direction = nextSpaceDir.dir;
				origin = ((x == spaceDir.x) && (y == spaceDir.y)) ? DIRECTION.HERE : TurningLeftDirection[direction]; // If not on start (where no direction should be excluded for limit check), take the direction we fled from
			} else {
				// Nothing since adjacencyCheckManager.turningLeftArray[y][x][direction] = TASK.DONE already !
			}
 		}
        if (spacesWalkedLocal.length > 0) {
            turningLog("Amount grid : ");
            adjacencyCheckManager.amountStepsArray.forEach(row => turningLog(row));
        }
		//amountStepsLog("Number of steps : " + numberSteps);			
        adjacencyCheckManager.amountStepsArray = cleanGridList(adjacencyCheckManager.amountStepsArray, spacesWalkedLocal, 0);
        //lastWalkDirectionArray = cleanGridList(lastWalkDirectionArray, spacesWalkedLocal, null);
        Array.prototype.push.apply(spacesWalkedGlobal, spacesWalkedLocal);
        Array.prototype.push.apply(spacesWithLimits, spacesMultiWalkedLocal);
		adjacencyCheckManager.turningLeftArray = cleanGridListTBD(adjacencyCheckManager.turningLeftArray, spacesMultiWalkedLocal); // TODO ligne redondante avec le nouveau rôle de spacesWalkedGlobal ?
    });

    adjacencyCheckManager.turningLeftArray = cleanGridListTBD(adjacencyCheckManager.turningLeftArray, spacesWalkedGlobal);
    adjacencyCheckManager.newBarriersArray = cleanGridList(adjacencyCheckManager.newBarriersArray, listSpacesClustersBarriered, false); // TODO pourquoi cette ligne ?
	
	// spacesWithLimits = open or undecided spaces that the "turning left" walks have crossed twice or more OR that were former limits.
	p_formerLimitSpaceList.forEach(space => {
		// if (adjacencyCheckManager.functionAdjacency(space.x, space.y) != ADJACENCY.NO) { // Note : was there a good reason "adjacent" former limits were checked again for business ?
		// Well actually there were one (two directions in a limit can split apart) 
		// But since it somewhat screws the manual check operation, I'll have to review it later. 
		// ... Waaaait, so re-checking undecided spaces only instead of "not unadjacent" spaces is actually better ? Maybe it was even the thing to do ? Anyway I started this beautiful cut of "checking ... later", so I guess I'll go on with it.
		// Well, I thought so with Nurikabe 1045 but LITS 30 unvalidates this. Keep thinking if former limits are checked automatically or not !
		if (adjacencyCheckManager.functionAdjacency(space.x, space.y) == ADJACENCY.UNDECIDED) {
			spacesWithLimits.push(space);
		}
	});
	
	var resultAC = exploreLimits(spacesWithLimits, p_limitArray);
	resultAC.newBARRIER = listSpacesClustersBarriered;
	resultAC.success = true;
	return resultAC;
}

function noSpacesToExplore(p_dir, p_exploLists) {
	const exploData = p_exploLists[p_dir];
	if (exploData.spacesExploToDo.length > 0) {
		return false;
	}
	for (var i = 0 ; i < exploData.linking.length ; i++) {
		if (!noSpacesToExplore(exploData.linking[i], p_exploLists)) {
			return false;
		}
	}
	return true;
}

// Failed something : this method MUST be recursive. I tried to check only the non-linked directions BUT : it's possible to link B to A (when neither has adjacency) then C to B 
//(C has adjacency, B gains it, but A remains untouched, yet A is the direction unlinked. So if it is the only one checked towards non-adjacency, it's an obvious fail)
// Consequences : some deductions failures with open spaces


// 2.2 If a space has limits (e.g. when walking with a closed space/edge to your left you cross this space more than once), tests if from each non-closed space aside has an open space. If yes, open that space. Also updates that limit if necessary.
function exploreLimits(p_spacesWithLimits, p_limitArray) {
	var tubesArrayList = [];
	var newAdjacencySpaces = []; // var listSpacesConfirmedAdjacency = [];
    var listSpacesLimitsAndTheirLimits = [];
    if (p_spacesWithLimits.length > 0) {
        adjacencyCheckManager.directionsArray = restartArray(adjacencyCheckManager.directionsArray, DIRECTION.UNDECIDED);
    }

	var exploList = [{}, {}, {}, {}];
    var xLimit, yLimit, exploList; 
	var spaceExplo;
	var index, actualDirection, newActualIndex;
	var x, y, origin;
	var numberNotFullyDiggedDirections, numberNotFullyDiggedDirectionsWithAdjacency;
		
	function getActualIndex(p_index) {
		var index = p_index;
		while (exploList[index].linked != DIRECTION.UNDECIDED) {
			index = exploList[index].linked;
		}
		return index;
	}
	
	p_spacesWithLimits.forEach(space => {
        var xLimit = space.x;
        var yLimit = space.y;
		
		KnownDirections.forEach(dir => {
			exploList[dir].spacesExploToDo = [];
			exploList[dir].containADJACENCY = false;
			exploList[dir].linked = DIRECTION.UNDECIDED;
			exploList[dir].linking = [];
			exploList[dir].alone = (p_limitArray[yLimit][xLimit] != null) && p_limitArray[yLimit][xLimit].isDirectionAlone(dir);
			if (neighborExists(xLimit, yLimit, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, dir) && isNotMeantClosed(xLimit + DeltaX[dir], yLimit + DeltaY[dir])) {
				exploList[dir].spacesExploToDo.push({
					x : xLimit + DeltaX[dir],
					y : yLimit + DeltaY[dir],
					index : dir,
					origin : OppositeDirection[dir]
				});
			}
		});
	
		adjacencyCheckManager.directionsArray[yLimit][xLimit] = DIRECTION.HERE;
		var spacesMadeDirty = [{
				x: xLimit,
				y: yLimit
			}
		];
		
		do {
			KnownDirections.forEach(dir0 => {
				if (exploList[dir0].alone && exploList[dir0].containADJACENCY) {
					exploList[dir0].spacesExploToDo = [];
				} else {					
					if (exploList[dir0].spacesExploToDo.length > 0) {
						spaceExplo = exploList[dir0].spacesExploToDo.pop();
						x = spaceExplo.x;
						y = spaceExplo.y;
						origin = spaceExplo.origin;
						index = adjacencyCheckManager.directionsArray[y][x];
						if (index == DIRECTION.UNDECIDED) { //Exploring
							adjacencyCheckManager.directionsArray[y][x] = dir0;
							spacesMadeDirty.push({
								x: x,
								y: y
							});
							if (adjacencyCheckManager.functionAdjacency(x, y) == ADJACENCY.YES) {
								exploList[getActualIndex(dir0)].containADJACENCY = true;
							}
							KnownDirections.forEach(dir => {							
								if (neighborExists(x, y, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, dir) && isNotMeantClosed(x + DeltaX[dir], y + DeltaY[dir])) {
									exploList[dir0].spacesExploToDo.push({
										x : x + DeltaX[dir],
										y : y + DeltaY[dir],
										origin : OppositeDirection[dir]
									});
								}	
							});
						// A space can explore a neighbor that will then explore the first space, but it will lead to nothing. So no endless loops.
						} else if (index != DIRECTION.HERE) {
							actualDirection = getActualIndex(dir0);
							newActualIndex = getActualIndex(index);
							if (newActualIndex != actualDirection) {
								//Merging
								// limitsLog("Merging " + newActualIndex + " and " + actualDirection + " in " + x + "," + y);
								const indexReceiver = (exploList[newActualIndex].spacesExploToDo.length > exploList[actualDirection].spacesExploToDo.length) ? newActualIndex : actualDirection;
								const indexGiver = (indexReceiver == newActualIndex) ? actualDirection : newActualIndex;
								exploList[indexGiver].linked = indexReceiver;
								exploList[indexReceiver].linking.push(indexGiver);
								exploList[getActualIndex(indexReceiver)].containADJACENCY = exploList[getActualIndex(indexReceiver)].containADJACENCY || exploList[indexReceiver].containADJACENCY || exploList[indexGiver].containADJACENCY;
								// Same remark as with the closed clusters
							}
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
				if (exploList[dir].linked == DIRECTION.UNDECIDED) { // Cluster mustn't be subordinated
					if (!noSpacesToExplore(dir, exploList)) {
						numberNotFullyDiggedDirections++;
						if (exploList[dir].containADJACENCY) { 
							numberNotFullyDiggedDirectionsWithAdjacency++;
						}
					}
				}
			});

		} while (!((numberNotFullyDiggedDirections == 0) || (numberNotFullyDiggedDirections == 1 && numberNotFullyDiggedDirectionsWithAdjacency == 1)));

		// if (spacesMadeDirty.length > 0) {
		//	adjacencyCheckManager.directionsArray.forEach(row => limitsLog(row));
		// } 
		adjacencyCheckManager.directionsArray = cleanGridList(adjacencyCheckManager.directionsArray, spacesMadeDirty, DIRECTION.UNDECIDED);

		// For this space : 1) create a new limit 2) put an adjacency if at least 2 branches contain one.
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
		if (!adjacencyLimit.equals(p_limitArray[space.y][space.x])) { 
			listSpacesLimitsAndTheirLimits.push({
				x: space.x,
				y: space.y,
				limit: adjacencyLimit
			});
		}

		//Make sure we add only NEW adjacency spaces, because this will be passed as a list of new events (and the lists should be empty if there is nothing to report)
		if (sideNumberWithAdjacency >= 2 && (adjacencyCheckManager.functionAdjacency(space.x, space.y) != ADJACENCY.YES) && !adjacencyCheckManager.tubesArray[space.y][space.x]) {
			newAdjacencySpaces.push({x: space.x, y : space.y});
			// If the space is part of a 'tube', e.g. a corridor of undecided spaces with only 2 open spaces each, add these spaces until the tube ends or an open space is found			
			var dirTubes = [];
			KnownDirections.forEach(dir => {
				if ((exploList[dir].alone || p_limitArray[space.y][space.x].isDirectionAlone(dir)) && exploList[dir].containADJACENCY) {
					dirTubes.push(dir);
				}
			});
			var newSpace, nsX, nsY;
			var continueTube;
			var directionInTube, newDirectionInTube;
			var spaceValue;
			dirTubes.forEach(dir => {
				continueTube = true;
				directionInTube = dir;
				nsX = space.x + DeltaX[directionInTube];
				nsY = space.y + DeltaY[directionInTube];
				continueTube = (adjacencyCheckManager.functionAdjacency(nsX, nsY) == ADJACENCY.UNDECIDED);
				while (continueTube) { // We know space (nsX, nsY) is undecided. But we don't know if it contains only one other direction.
					// Add (nsX, nsY) to the list of spaces to pass to adjacent (since we are in a tube where both extremities have an open space)
					// Also, add to a tube checker 
					// Determine the new direction among the 3 remaining. In order to continue it must be the only non-closed direction AND it mustn't be open. Otherwise, we stop.
					// If we continue : reset nsX, nsY, and directionInTube
					newAdjacencySpaces.push({x: nsX, y : nsY});
					adjacencyCheckManager.tubesArray[nsY][nsX] = true;
					tubesArrayList.push({x : nsX, y : nsY});
					newDirectionInTube = null;
					[TurningLeftDirection[directionInTube], directionInTube, TurningRightDirection[directionInTube]].forEach(dir2 => {
						if (continueTube && neighborExists(nsX, nsY, adjacencyCheckManager.xLength, adjacencyCheckManager.yLength, dir2)) {
							spaceValue = adjacencyCheckManager.functionAdjacency(nsX + DeltaX[dir2], nsY + DeltaY[dir2]);
							if (spaceValue == ADJACENCY.YES) {
								continueTube = false;
							} else if (spaceValue == ADJACENCY.UNDECIDED) {
								continueTube = (newDirectionInTube == null); // Unicity !
								newDirectionInTube = dir2;	
							}
						}
					});
					continueTube &= (newDirectionInTube != null);
					directionInTube = newDirectionInTube;
					if (directionInTube != null) {
						nsX += DeltaX[directionInTube];
						nsY += DeltaY[directionInTube];
					}
				}
			});
		}
		//limitsLog(space.x + "," + space.y + " : created limit " + adjacencyLimit.toString() + " ; sides with Adjacency : " + sideNumberWithAdjacency);
    });
	// End of 2.2, now results ;)
	
	adjacencyCheckManager.tubesArray = cleanGridList(adjacencyCheckManager.tubesArray, tubesArrayList, false); // Cleaning before or after ? Could have been done before but it's not a huge deal
	tubesArrayList = [];
	return {
        newADJACENCY: newAdjacencySpaces,
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

function amountStepsLog(p_message) {
	console.log(p_message);
}