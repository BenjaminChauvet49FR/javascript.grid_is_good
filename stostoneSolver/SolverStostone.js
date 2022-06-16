// Setup
const NOT_FORCED = -1;
const CLUSTER_WITH_FILL= {
	NOT_FOUND:-1,
	MULTI:-2
}
const NOT_CLUSTERED = -1;

const PASS_CATEGORY = {
	REGION : 1,
	COLUMN : 2
}

function SolverStostone(p_wallArray, p_indicationsRegions) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_indicationsRegions);
}

SolverStostone.prototype = Object.create(GeneralSolver.prototype);
DummySolver = function() {
	return new SolverStostone(generateWallArray(1,1),[]);
}

SolverStostone.prototype.constructor = SolverStostone;

SolverStostone.prototype.construct = function(p_wallArray, p_indicationsRegions) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.answerArray = [];
	this.clusterArray = [];
	var ix, iy;
	var lastRegionNumber = 0;
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterRegionsNewNOsClosure(this), filterRegionsNewYESClosure(this), filterHeightClosure(this)]);// Two other closures !!!!!
	this.methodsSetPass = {comparisonMethod : compareSolveEvents, copyMethod : copying, argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this)
	}	
	
	this.answerArray = generateValueArray(this.xLength, this.yLength, FILLING.UNDECIDED);
	this.clusterArray = generateValueArray(this.xLength, this.yLength, 0);
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	this.containsClueArray = generateValueArray(this.xLength, this.yLength, false);
	
	// Initialize data of regions
	this.regions = [];
	this.heightDiffTriangle = [];
	for(var i = 0 ; i < this.regionsNumber ; i++) { // Note : no indexes....
		this.regions.push({
			index : i,
			spaces : spacesByRegion[i],
			size : spacesByRegion[i].length,
			forcedValue : null,
			numberStones : null,
			placed : {
				YES : 0,
				NOs : 0
			},
			yHighest : null, // Constant : highest y in a region
			yLowest : null, // Constant : highest y in a region
			heightStoneYHighest : null, // the height-placement of the stones if there were a stone in the highest stone of a region. May be negative, but not greater than (this.yLength/2-1) .
			heightDifferenceDependencies : [],
			clusters : [],
			indexClusterWithFill : CLUSTER_WITH_FILL.NOT_FOUND,
			lastPlacedYES : {} // Last placed YES in this region. (for filter)
		});
		this.heightDiffTriangle.push([]); //(Triangle must be : [], [10], [20,21], [30,31,32] ...)
		for(var j=0 ; j<i ; j++) {
			this.heightDiffTriangle[i].push(null);
		}
				
	}
	
	this.expectedStonesPerColumn = this.yLength/2;
	this.notPlacedYetColumns = [];
	for (ix = 0 ; ix < this.xLength ; ix++) {
		this.notPlacedYetColumns.push({YES : this.expectedStonesPerColumn, NOs : this.expectedStonesPerColumn});
	}
	
	// Initialize data of regions spaces + contact between regions (triangle and region data)
	var ir;
	var iOtherR;
	var region;
	for(iy = 0;iy < this.yLength;iy++) {
		for(ix = 0;ix < this.xLength;ix++) {
			ir = this.regionArray[iy][ix];
			region = this.regions[ir];
			if (region.yHighest == null) {
				region.yHighest = iy;
			}
			region.yLowest = iy;
		}
	}
	
	// High convention : no banned space assumption. All are useful in Stostone !
	
	this.sameRegionColumnsArray = generateFunctionValueArray(this.xLength, this.yLength, 
		function() {return {nextYBelow : null, nextYAbove : null}} );
	// Initializations of values of y right above and right below within the same region and column (smartness : if a space is black and the one above/below is white and in the same region, all the spaces below/above in the same column and region must be white)
	var ir, yy;
	for (var x = 0 ; x < this.xLength ; x++) {
		for (var y = this.yLength-1 ; y >= 0 ; y--) {
			ir = this.regionArray[y][x];
			yy = y-1;
			while (yy >= this.regions[ir].yHighest && this.regionArray[yy][x] != ir) {
				yy--;
			}
			if (yy >= this.regions[ir].yHighest) {
				this.sameRegionColumnsArray[y][x].nextYAbove = yy;
				this.sameRegionColumnsArray[yy][x].nextYBelow = y;
			}
		}
	}
	
	
	for(var ir = 0;ir<this.regionsNumber;ir++) {
		region = this.regions[ir];
		region.size = region.spaces.length;
		
		region.clusters = [region.spaces.slice()];
	}
	// Initialize data of all regions that are possible only now that spaces by region are known.
	var firstSpace;
	p_indicationsRegions.forEach(indic => {
		region = this.regions[indic.index];
		region.numberStones = indic.value;
		firstSpace = region.spaces[0];
		this.containsClueArray[firstSpace.y][firstSpace.x] = true;
	});
	
	this.regionsNewNOsChecker = new CheckCollection(this.regions.length);
	this.regionsNewYESChecker = new CheckCollection(this.regions.length);
	this.heightCheckerYESList = [];
	this.heightCheckerNOsList = [];
	this.dejaVuNOChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	// Note : no need for an array for these lists since no space should be added more than once !
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)

SolverStostone.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.regionArray[p_y][p_x]];
}

SolverStostone.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

SolverStostone.prototype.containsClueSpace = function(p_x, p_y) {
	return this.containsClueArray[p_y][p_x];
}

SolverStostone.prototype.forcedValue = function(p_ir) {
	return this.regions[p_ir].numberStones;
}

SolverStostone.prototype.getSpaceCoordinates = function(p_indexRegion, p_indexSpace) {
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

//Getter : answer
SolverStostone.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

// Getter : difference of HSYHs :
SolverStostone.prototype.getHeightDifference = function(p_index1, p_index2) {
	if (p_index1 < p_index2) {
		return this.getHeightDifference(p_index2, p_index1);
	}
	return this.heightDiffTriangle[p_index1][p_index2];
}

//--------------
// Input

SolverStostone.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverStostone.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {	
	return this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverStostone.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverStostone.prototype.emitPassRegion = function(p_indexRegion) {
	listPassNow = this.generateEventsForRegionPass(p_indexRegion);
	this.passEventsSafe(listPassNow, {category : PASS_CATEGORY.REGION, index : p_indexRegion}); 
}

SolverStostone.prototype.emitPassColumn = function(p_x) {
	listPassNow = this.generateEventsForColumnPass(p_x);
	this.passEventsSafe(listPassNow, {category : PASS_CATEGORY.COLUMN, x : p_x}); 
}

SolverStostone.prototype.makeMultiPass = function() {
	this.multiPassSafe(this.methodsSetMultipass);
}

SolverStostone.prototype.makeResolution = function() { 
	this.resolve();
}

//--------------------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_solveEvent) {
		if (p_solveEvent.kind == KIND.SYMBOL) {
			return p_solver.putNew(p_solveEvent.x,p_solveEvent.y, p_solveEvent.symbol);
		} else if (p_solveEvent.kind == KIND.HEIGHT_STONE) {
			return p_solver.putHeightStone(p_solveEvent.heightStoneYHighest, p_solveEvent.index);
		} else {
			return p_solver.putHeightDifference(p_solveEvent.indexMax, p_solveEvent.indexMin, p_solveEvent.yDelta);
		}
	}
}

SolverStostone.prototype.putNew = function(p_x, p_y, p_symbol) {
	if (p_symbol == this.answerArray[p_y][p_x]) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != FILLING.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	var region = this.getRegion(p_x, p_y);
	this.answerArray[p_y][p_x] = p_symbol;
	if (p_symbol == FILLING.YES) {
		region.placed.YES++;
		this.notPlacedYetColumns[p_x].YES--;
		this.heightCheckerYESList.push({x : p_x, y : p_y});
		this.regionsNewYESChecker.add(this.getRegionIndex(p_x, p_y));
		region.lastPlacedYES.x = p_x;
		region.lastPlacedYES.y = p_y;
	}
	else {
		region.placed.NOs++;
		this.notPlacedYetColumns[p_x].NOs--;
		this.heightCheckerNOsList.push({x : p_x, y : p_y});
		this.regionsNewNOsChecker.add(this.getRegionIndex(p_x, p_y));
	}
	return EVENT_RESULT.SUCCESS;
}

SolverStostone.prototype.putHeightStone = function(p_heightStoneYHighest, p_index) {
	const previousHeight = this.regions[p_index].heightStoneYHighest;
	if (previousHeight != null) {
		return previousHeight == p_heightStoneYHighest ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
	} else {		
		this.regions[p_index].heightStoneYHighest = p_heightStoneYHighest;
		return EVENT_RESULT.SUCCESS;
	}
}

SolverStostone.prototype.putHeightDifference = function(p_indexMax, p_indexMin, p_diff) {
	const formerDiff = this.heightDiffTriangle[p_indexMax][p_indexMin];
	if (formerDiff != null) {
		return formerDiff == p_diff ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
	}
	this.heightDiffTriangle[p_indexMax][p_indexMin] = p_diff;
	this.regions[p_indexMax].heightDifferenceDependencies.push(p_indexMin);
	this.regions[p_indexMin].heightDifferenceDependencies.push(p_indexMax);
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind == KIND.SYMBOL) {
			p_solver.undoSpaceEvent(p_eventToUndo);
		}
		else if (p_eventToUndo.kind == KIND.HEIGHT_STONE) {
			p_solver.undoHeightStone(p_eventToUndo);
		} else {
			p_solver.undoHeightDifference(p_eventToUndo);
		}
	}
}

SolverStostone.prototype.undoSpaceEvent = function(p_eventToUndo) {
	const region = this.getRegion(p_eventToUndo.x, p_eventToUndo.y);
	this.answerArray[p_eventToUndo.y][p_eventToUndo.x] = FILLING.UNDECIDED;
	if (p_eventToUndo.symbol == FILLING.YES) {
		region.placed.YES--;			
		this.notPlacedYetColumns[p_eventToUndo.x].YES++;
	} else {
		region.placed.NOs--;
		this.notPlacedYetColumns[p_eventToUndo.x].NOs++;
	}
}

SolverStostone.prototype.undoHeightStone = function(p_eventToUndo) {
	this.regions[p_eventToUndo.index].heightStoneYHighest = null;
}

SolverStostone.prototype.undoHeightDifference = function(p_eventToUndo) {
	this.heightDiffTriangle[p_eventToUndo.indexMax][p_eventToUndo.indexMin] = null;
	this.regions[p_eventToUndo.indexMax].heightDifferenceDependencies.pop();
	this.regions[p_eventToUndo.indexMin].heightDifferenceDependencies.pop(); //High convention : undo in reverse order assumption
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Stostone"}];
		p_solver.regions.forEach(region => {
			if ((region.size == region.numberStones) || (region.size == 1)) {
				region.spaces.forEach(space =>
					{listQSEvents.push(new SpaceEvent(space.x, space.y, FILLING.YES))}
				);
			}
		});		
		return listQSEvents;	
	}
}

//-------------------------------- 
// Deductions


deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == KIND.SYMBOL) {
			//Put symbol into space
			x = p_eventBeingApplied.x;
			y = p_eventBeingApplied.y;
			symbol = p_eventBeingApplied.symbol;
			ir = p_solver.getRegionIndex(x, y);
			region = p_solver.regions[ir];
			if (symbol == FILLING.YES) {
				// Adjacent regions, disjoint groups
				p_solver.existingNeighborsCoors(x, y).forEach(coors => {
					if (p_solver.regionArray[coors.y][coors.x] != ir) {
						p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, FILLING.NO));
					} 
				});
				// Number control
				if (region.numberStones != null && region.placed.YES == region.numberStones) {
					region.spaces.forEach(coors => {
						if (p_solver.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
							p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, FILLING.NO));
						} 
					});
				}
				// Same column, same region
				if (y > 0 && p_solver.answerArray[y-1][x] == FILLING.NO && p_solver.regionArray[y-1][x] == ir) {
					p_solver.deductionsWhiteColumnUpwards(p_listEventsToApply, x, y-1, ir); 	
				}
				if (y <= p_solver.yLength-2 && p_solver.answerArray[y+1][x] == FILLING.NO && p_solver.regionArray[y+1][x] == ir) {
					p_solver.deductionsWhiteColumnDownwards(p_listEventsToApply, x, y+1, ir);
				}
				// Column number check
				if (p_solver.notPlacedYetColumns[x].YES == 0) {
					p_solver.deductionsFillColumnWith(p_listEventsToApply, x, FILLING.NO);
				}
			} else {
				// At least one stone per region
				if (region.placed.NOs == region.size-1) { 
					for (var is = 0 ; is < region.size ; is++) {
						coors = region.spaces[is];
						if (p_solver.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
							p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, FILLING.YES));
							break;
						}
					}
				}
				// Number control
				if (region.numberStones != null && region.placed.NOs == region.size-region.numberStones) {
					region.spaces.forEach(coors => {
						if (p_solver.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
							p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, FILLING.YES));
						} 
					});
				}
				// Same column, same region
				if (y > 0 && p_solver.answerArray[y-1][x] == FILLING.YES && p_solver.regionArray[y-1][x] == ir) {
					p_solver.deductionsWhiteColumnDownwards(p_listEventsToApply, x, y, ir); 	
				}
				if (y <= p_solver.yLength-2 && p_solver.answerArray[y+1][x] == FILLING.YES && p_solver.regionArray[y+1][x] == ir) {
					p_solver.deductionsWhiteColumnUpwards(p_listEventsToApply, x, y, ir); 						
				}
				// Column number check
				if (p_solver.notPlacedYetColumns[x].NOs == 0) {
					p_solver.deductionsFillColumnWith(p_listEventsToApply, x, FILLING.YES);
				}
			}
		} else if (p_eventBeingApplied.kind == KIND.HEIGHT_STONE) { 
			// Apply height differences
			const ir = p_eventBeingApplied.index; 
			const hsyh = p_eventBeingApplied.heightStoneYHighest;
			var heightDifference;
			p_solver.regions[ir].heightDifferenceDependencies.forEach(ir2 => {
				heightDifference = p_solver.getHeightDifference(ir, ir2);
				if (heightDifference != null) {
					p_listEventsToApply.push(new HeightStoneEvent(ir2, hsyh + heightDifference * (ir2 > ir ? 1 : -1) )); 
				}
			});
		} else {
			// Apply height region	
			const heightDifference = p_eventBeingApplied.yDelta;
			const irMax = p_eventBeingApplied.indexMax;
			const irMin = p_eventBeingApplied.indexMin;
			const hsyhRMax = p_solver.regions[irMax].heightStoneYHighest;
			const hsyhRMin = p_solver.regions[irMin].heightStoneYHighest;
			if (hsyhRMax != null) {				
				p_listEventsToApply.push(new HeightStoneEvent(irMin, hsyhRMax - heightDifference));
			}
			if (hsyhRMin != null) {				
				p_listEventsToApply.push(new HeightStoneEvent(irMax, hsyhRMin + heightDifference));
			}
		}
	}
}

// When a space in p_x, p_y is empty, the one below it is in the same region and has a stone : clear all the spaces above in the same column and region since they must be empty
SolverStostone.prototype.deductionsWhiteColumnDownwards = function(p_listEventsToApply, p_x, p_y, p_ir) {
	const region = this.getRegion(p_x, p_y);
	for (var y = p_y+1 ; y <= region.yLowest ; y++) {
		if (this.regionArray[y][x] == p_ir) {
			p_listEventsToApply.push(new SpaceEvent(x, y, FILLING.NO));
		}
	}
}

// Same but upwards
SolverStostone.prototype.deductionsWhiteColumnUpwards = function(p_listEventsToApply, p_x, p_y, p_ir) {
	const region = this.getRegion(p_x, p_y);
	for (var y = p_y-1 ; y >= region.yHighest ; y--) {
		if (this.regionArray[y][x] == p_ir) {
			p_listEventsToApply.push(new SpaceEvent(x, y, FILLING.NO));
		}
	}
}

// Fill a column with the missing symbols
SolverStostone.prototype.deductionsFillColumnWith = function(p_listEventsToApply, p_x, p_symbolToFill) {
	for (var y = 0 ; y < this.yLength ; y++) {
		if (this.answerArray[y][p_x] == FILLING.UNDECIDED) {
			p_listEventsToApply.push(new SpaceEvent(p_x, y, p_symbolToFill));
		}
	}
}

// Filters :
/* 
(possible cluster = orthogonally adjacent set of spaces without an X)

For each marked region with a new X :
Check the possible clusters or the updated ones
If a possible cluster contains an O, ban the other ones
If the region is size-forced and the possible cluster is too small, ban it

Clusters should be identified by now. 
For each marked region with a new O :
Ban clusters that don't contain this O in this region
Two clsters, or a cluster to small, with an O ? Failure !
*/
//Note : possible optimization ? Volcanic control of size, or whatever it means...

function abortClosure(p_solver) {
	return function () {
		p_solver.regionsNewNOsChecker.clean();
		p_solver.regionsNewYESChecker.clean();
		p_solver.dejaVuNOChecker.clean();
		p_solver.cleanHeightChecker();
	}
}	

SolverStostone.prototype.cleanHeightChecker = function() {
	this.heightCheckerNOsList = [];
	this.heightCheckerYESList = [];
}

// Note : What's next is copied onto Shimaguni
function filterRegionsNewNOsClosure(p_solver) {
	return function () {
		var listEventsToApply = [];
		var region;
		var listCluster, ic;
		var i, ir;
		for (i = 0 ; i < p_solver.regionsNewNOsChecker.list.length ; i++) {
			ir = p_solver.regionsNewNOsChecker.list[i];
			region = p_solver.regions[ir];
			if (region.numberStones != null) {
				//Updates clusters ; then ban clusters that don't contain a filled space
				p_solver.updateClustersRegion(ir);
				if (region.indexClusterWithFill == CLUSTER_WITH_FILL.MULTI) {
					listEventsToApply.push(new FailureEvent());
					return listEventsToApply;
				} else if (region.indexClusterWithFill != CLUSTER_WITH_FILL.NOT_FOUND) {
					for(var ic = 0;ic < region.clusters.length; ic++) {
						if (ic != region.indexClusterWithFill) {
							region.clusters[ic].forEach(
								space => {listEventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO))}
							);
						}
					}
				}
				//Put NOs in spaces that would have become too small
				// Also, find the max size of clusters
				for (ic = 0 ; ic < region.clusters.length ; ic++) {
					listCluster = region.clusters[ic];
					if (listCluster.length < region.numberStones) {
						if (region.indexClusterWithFill == ic) {
							listEventsToApply.push(new FailureEvent());
							return listEventsToApply;
						} else {							
							listCluster.forEach(space => {listEventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO))});
						}
					}
				};
				// Note : block cut from Shimaguni here. (copy pasting back into shimaguni will take time)
			}
		};
		p_solver.regionsNewNOsChecker.clean();
		return listEventsToApply;
	}
}

/**
Draws all clusters of a region that needs to be updated ; alters region ; returns the cluster that contains an O... should be only one .
The "index cluster with fill" of the region becomes the index of the cluster that is filled (if there is only one), multi (if there are several) or "not found" (if there are none)
*/
SolverStostone.prototype.updateClustersRegion = function(p_indexRegion) {
	var region = this.regions[p_indexRegion];
	region.spaces.forEach(space => {this.clusterArray[space.y][space.x] = NOT_CLUSTERED}); 
	region.indexClusterWithFill = CLUSTER_WITH_FILL.NOT_FOUND;
	var clustersList = [];
	var oneCluster;
	var indexClusterNow;
	region.spaces.forEach(space => {
		oneCluster = this.fillCluster(space.x, space.y, p_indexRegion, clustersList.length);
		if (oneCluster.length > 0) {
			clustersList.push(oneCluster);
		}
		if (this.answerArray[space.y][space.x] == FILLING.YES) {
			indexClusterNow = this.clusterArray[space.y][space.x];
			if (region.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND) {
				region.indexClusterWithFill = indexClusterNow;
			} else if (region.indexClusterWithFill != indexClusterNow) {
				region.indexClusterWithFill = CLUSTER_WITH_FILL.MULTI;
				return;
			}
		}
	});
	region.clusters = clustersList;
}

//Looks for all unclustered spaces, updates them to the value and returns the list of spaces updated.
// [] if no cluster (we try to cluster a space with an X or an already clustered space)
SolverStostone.prototype.fillCluster = function(p_x,p_y,p_indexRegion,p_value) {
	var listUpdatedSpaces = [];
	var listSpacesToUpdate = [{x : p_x, y : p_y}];
	var space, x, y;
	do {
		space = listSpacesToUpdate.pop();
		x = space.x;
		y = space.y;
		if (this.clusterArray[y][x] == NOT_CLUSTERED && this.regionArray[y][x] == p_indexRegion && this.answerArray[y][x] != FILLING.NO) {
			this.clusterArray[y][x] = p_value;
			listUpdatedSpaces.push(space);
			this.existingNeighborsCoorsDirections(x, y).forEach(coors => {
				listSpacesToUpdate.push({x : coors.x, y : coors.y});
			});
		}
	} while (listSpacesToUpdate.length != 0);
	return listUpdatedSpaces;
}

// Prerequiste : all clusters have their shape updated by now
function filterRegionsNewYESClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var i, ir, region, clusterBelong;
		for (i = 0 ; i < p_solver.regionsNewYESChecker.list.length ; i++) {
			ir = p_solver.regionsNewYESChecker.list[i];
			region = p_solver.regions[ir];
			// If this is our very first O placed (or several of 'em) in this region, an update is mandatory so a "cluster with fill" is found.
			// clusterBelong = (region.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND) ? p_solver.clusterArray[introduced.y][introduced.x] : region.indexClusterWithFill;
			p_solver.updateClustersRegion(ir); 
			// Important : since a YES has been added, it is possible that indexClusterWithFill has changed, which justifies to update the clusters. (I lost some time on this by removing it from copy-paste)
			clusterBelong = (region.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND) ? p_solver.clusterArray[region.lastPlacedYES.y][region.lastPlacedYES.x] : region.indexClusterWithFill;
			// Ban clusters that don't contain a filled space
			if (clusterBelong == CLUSTER_WITH_FILL.MULTI) {
				return FILTER_FAILURE;
			} else {
				for(var ic = 0;ic < region.clusters.length; ic++) {
					if (ic != clusterBelong) {
						region.clusters[ic].forEach(
							space => {listEventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO))}
						);
					}
				}
			} 
			// Note : cut from Shimaguni.
		};
		p_solver.regionsNewYESChecker.clean();
		return listEventsToApply;
	}
}

/*
Consistency within each region should be assured by now. 
Look in a column
For each new X, look if it binds the floor/ceiling and an O, or two Os.
For each new O, look it it is bound to another O or floor/ceiling.
In either case : 
-floor/ceiling : trigger an height event on the region
-two Os : 
	-if both heights are known, control if the height difference is consistent
	-if one height is known, create a region height event for the unknown one
	-if neither height is known, create an height difference event
*/
function filterHeightClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var x, y, yy, upY, downY;
		p_solver.heightCheckerYESList.forEach(coors => {
			if (isFailed(listEventsToApply)) {
				return;
			}
			x = coors.x;
			y = coors.y;
			// Upwards
			yy = y-1;
			while (yy >= 0 && p_solver.answerArray[yy][x] == FILLING.NO) {
				p_solver.dejaVuNOChecker.add(x, yy);
				yy--;
			}
			if (yy == -1) {
				listEventsToApply.push(HeightStoneAuxEvent(y, 0, p_solver.getRegion(x, y) ));
			} else if (p_solver.answerArray[yy][x] == FILLING.YES && (y - yy >= 2)) { 
				p_solver.deductionsBetweenTwoStones(listEventsToApply, x, yy, y);
			}
			if (isFailed(listEventsToApply)) {
				return;
			}
			// Downwards
			yy = y+1;
			if ((yy == p_solver.yLength) || !p_solver.dejaVuNOChecker.array[yy][x]) {				
				while (yy < p_solver.yLength && p_solver.answerArray[yy][x] == FILLING.NO) {
					p_solver.dejaVuNOChecker.add(x, yy);
					yy++;
				}
				if (yy == p_solver.yLength) {
					listEventsToApply.push(HeightStoneAuxEvent(y, p_solver.expectedStonesPerColumn-1, p_solver.getRegion(x, y) ));
				} else if (p_solver.answerArray[yy][x] == FILLING.YES && (yy - y >= 2)) {
					p_solver.deductionsBetweenTwoStones(listEventsToApply, x, y, yy);
				}
			}
		});
		p_solver.heightCheckerNOsList.forEach(coors => {
			if (isFailed(listEventsToApply)) {
				return;
			}
			x = coors.x;
			y = coors.y;
			upY = null;
			downY = null;
			if (!p_solver.dejaVuNOChecker.array[y][x]) {
				yy = y-1;
				while (yy >= 0 && p_solver.answerArray[yy][x] == FILLING.NO) {
					p_solver.dejaVuNOChecker.add(x, yy);
					yy--;
				}
				if (yy == -1 || p_solver.answerArray[yy][x] == FILLING.YES) {
					upY = yy;
				}
				yy = y+1;
				while (yy < p_solver.yLength && p_solver.answerArray[yy][x] == FILLING.NO) {
					p_solver.dejaVuNOChecker.add(x, yy);
					yy++;
				}
				if (yy == p_solver.yLength || p_solver.answerArray[yy][x] == FILLING.YES) {
					downY = yy;
				}
				if (upY != null && downY != null) {					
					if (upY == -1) {
						listEventsToApply.push(HeightStoneAuxEvent(downY, 0, p_solver.getRegion(x, downY) ));
					} else if (downY == p_solver.yLength) { // Note : both upY and downY reaching their extremities is impossible due to the global check on column in main part of deductions 
						listEventsToApply.push(HeightStoneAuxEvent(upY, p_solver.expectedStonesPerColumn-1, p_solver.getRegion(x, upY) ));
					} else {	
						p_solver.deductionsBetweenTwoStones(listEventsToApply, x, upY, downY);
					}					
				}
			}
		});
		
		p_solver.dejaVuNOChecker.clean();
		p_solver.cleanHeightChecker();
		return listEventsToApply;
	}
}


// Prerequiste : p_y1 and p_y2 are the heights of stones. There are only empty spaces between them. p_y2 > p_y1.
// So : both heights in columns are known ? check consistency. Neither is known ? Difference event. One is known ? HSYH event.
SolverStostone.prototype.deductionsBetweenTwoStones = function(p_listEventsToApply, p_x, p_y1, p_y2) {
	const i1 = this.getRegionIndex(p_x, p_y1);
	const i2 = this.getRegionIndex(p_x, p_y2);
	const yHighest1 = this.getRegion(p_x, p_y1).yHighest;
	const yHighest2 = this.getRegion(p_x, p_y2).yHighest;
	const hsyh1 = this.getRegion(p_x, p_y1).heightStoneYHighest;
	const hsyh2 = this.getRegion(p_x, p_y2).heightStoneYHighest;
	// Some math : 
	// pos.stone y2 = pos.stone y1+1
	// (y2-yHighest2+hsyh2) = (y1-yHighest1+hsyh1) + 1
	// hsyh2-hsyh1 = y1-yHighest1 - y2 + yHighest2 + 1
	const deltaHSYHs = (p_y1-yHighest1)-(p_y2-yHighest2)+1;
	if (hsyh1 == null) {
		if (hsyh2 == null) {			
			p_listEventsToApply.push(new HeightDifferenceEvent(i2, i1, deltaHSYHs)); // Look carefully at the order of arguments here and in the method ! 
		} else {
			p_listEventsToApply.push(new HeightStoneEvent(i1, hsyh2 - deltaHSYHs));
		}
 	} else {
		if (hsyh2 == null) {
			p_listEventsToApply.push(new HeightStoneEvent(i2, hsyh1 + deltaHSYHs));
		} else if (hsyh2 - hsyh1 != deltaHSYHs) {
			p_listEventsToApply.push(new FailureEvent());
		}
	}		
}

// Note : possible but not done because pass does the job : 
// looking for 2 stones in a column, if they are separated by as many undecided spaces as their height difference minus 1, fill the undecided spaces. If they are consecutive in height, empty the undecided spaces. If not enough undecided spaces, failure.
// banning spaces above a stone of height 0 or below a stone of height maximal (note : height increases from top to bottom)

// --------
// Pass 

function compareSolveEvents(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol],
	[p_event2.y, p_event2.x, p_event2.symbol]]);
}

function copying(p_event) {
	return p_event.copy();
}

function namingCategoryPassClosure(p_solver) {
	return function(p_indexPass) {		
		switch (p_indexPass.category) {
			case PASS_CATEGORY.REGION : return "region " + logRegionInfo(p_solver, p_indexPass.index) ; break;
			case PASS_CATEGORY.COLUMN : return "column " + p_indexPass.x ; break;
		}
	}
}

SolverStostone.prototype.generateEventsForRegionPass = function(p_ir) {
	var listPass = [];
	this.regions[p_ir].spaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == FILLING.UNDECIDED) {			
			listPass.push(eventsForOneSpacePass(space.x, space.y));
		}
	});
	return listPass;
}

SolverStostone.prototype.generateEventsForColumnPass = function(p_x) {
	var listPass = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		if (this.answerArray[y][p_x] == FILLING.UNDECIDED) {			
			listPass.push(eventsForOneSpacePass(p_x, y));
		}
	}
	return listPass;
}

function eventsForOneSpacePass(p_x, p_y) {
	return [new SpaceEvent(p_x, p_y, FILLING.YES), new SpaceEvent(p_x, p_y, FILLING.NO)];
}

// --------
// Multipass

function generateEventsForPassClosure (p_solver) {
	return function (p_indexPass) {
		if (p_indexPass.category == PASS_CATEGORY.COLUMN) {
			return p_solver.generateEventsForColumnPass(p_indexPass.x);			
		} else {
			return p_solver.generateEventsForRegionPass(p_indexPass.index);
		}
	}
}

function orderedListPassArgumentsClosure  (p_solver) {
	return function () {
		var listIndexesPass = [];
		for (var x = 0 ; x < p_solver.xLength ; x++) {
			listIndexesPass.push({category : PASS_CATEGORY.COLUMN, x : x});
		}
		for (var ir = 0 ; ir < p_solver.regions.length ; ir++) {
			listIndexesPass.push({category : PASS_CATEGORY.REGION, index : ir});
		}			
		return listIndexesPass; 
	}
} 

// --------
// Solution

SolverStostone.prototype.isSolved = function() {
	var region;
	for (var ir = 0 ; ir < this.regions.length ; ir++) {
		region = this.regions[ir];
		if (region.placed.NOs + region.placed.YES != region.size) {
			return false;
		}
	}
	return true; 
}

function isSolvedClosure(p_solver) {
	return function() {
		return p_solver.isSolved();
	}
}

function searchClosure(p_solver) {  
	return function() {
		var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		

		// Find index with the most solutions
		var bestIndex = {nbD : -1};
		var nbDeductions;
		var event_;
		var resultDeds;
		for (solveX = 0 ; solveX < p_solver.xLength ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
			for (solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
				if (!p_solver.answerArray[solveY][solveX] == FILLING.UNDECIDED) {
					[FILLING.YES, FILLING.NO].forEach(value => {
						event_ = new SpaceEvent(solveX, solveY, value);
						resultDeds = p_solver.tryToApplyHypothesis(event_); 
						if (resultDeds != DEDUCTIONS_RESULT.FAILURE) {							
							nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
							if (bestIndex.nbD < nbDeductions) {
								bestIndex = {nbD : nbDeductions, x : event_.x, y : event_.y}
							}
							p_solver.undoToLastHypothesis();
						}
					});	
				}
			}
		}
		
		// Naive, because we can with Stostone !
		return p_solver.tryAllPossibilities(
			[new SpaceEvent(bestIndex.x, bestIndex.y, FILLING.YES), new SpaceEvent(bestIndex.x, bestIndex.y, FILLING.NO)]
		);
	}
}