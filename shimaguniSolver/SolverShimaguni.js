// Setup
const NOT_FORCED = -1;

function SolverShimaguni(p_wallArray, p_indicationsRegions) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_indicationsRegions);
}

SolverShimaguni.prototype = Object.create(GeneralSolver.prototype);
DummySolver = function() {
	return new SolverShimaguni(generateWallArray(1,1),[]);
}

SolverShimaguni.prototype.constructor = SolverShimaguni;

SolverShimaguni.prototype.construct = function(p_wallArray, p_indicationsRegions) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.answerArray = [];
	this.clusterArray = [];
	var ix,iy;
	var lastRegionNumber = 0;
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterClustersClosure(this)]);
	this.methodsSetPass = {comparisonMethod : compareSolveEvents, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}	
	
	this.answerArray = generateValueArray(this.xLength, this.yLength, FILLING.UNDECIDED);
	this.clusterArray = generateValueArray(this.xLength, this.yLength, 0);
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	
	// Blantly initialize data of regions
	this.regions = [];
	this.contactTriangle = [];
	for(var i = 0 ; i < this.regionsNumber ; i++) { // Note : no indexes....
		this.regions.push({
			spaces : spacesByRegion[i],
			YES : 0,
			NOs : 0,
			UNDEFs : 0,
			size : spacesByRegion[i].length,
			contact : [],
			possibleValues : [],
			minVal : 1,
			maxVal : 0,
			forcedVal : NOT_FORCED,
			freshClusters : false,
			clusters : [],
			indexClusterWithFill : CLUSTER_WITH_FILL.NOT_FOUND,
		});
		this.contactTriangle.push([]); //(Triangle must be : [], [10], [20,21], [30,31,32] ...)
		if (i > 1) {
			this.contactTriangle.push([]);	
			for(var j=0 ; j<i ; j++) {
				this.contactTriangle[i].push(false);
			}
		}		
	}
	
	// Initialize data of regions spaces + contact between regions (triangle and region data)
	var ir;
	var iOtherR;
	var region;
	for(iy = 0;iy < this.yLength;iy++) {
		for(ix = 0;ix < this.xLength;ix++) {
			ir = this.regionArray[iy][ix];
			if (iy < this.yLength-1) {
				iOtherR = this.regionArray[iy+1][ix];
				if (iOtherR != ir) {
					this.validateContact(ir, iOtherR);
				}
			}			
			if (ix < this.xLength-1) {
				iOtherR = this.regionArray[iy][ix+1];
				if (iOtherR != ir) {
					this.validateContact(ir, iOtherR);
				}
			}
		}
	}
	
	// Initialize data of all regions that are possible only now that spaces by region are known.
	p_indicationsRegions.forEach(indic => {
		region = this.regions[indic.index];
		region.forcedVal = indic.value;
	});
	for(var ir = 0;ir<this.regionsNumber;ir++) {
		region = this.regions[ir];
		region.size = region.spaces.length;
		region.UNDEFs = region.size;
		region.YES = 0;
		region.NOs = 0;
		if (region.forcedVal == NOT_FORCED) {
			region.minVal = 1; 
			region.maxVal = region.size;
			for(var is=0 ; is < region.size ; is++) {
				region.possibleValues.push(true);
			}
		}
		else {
			region.minVal = this.forcedValue(ir);
			region.maxVal = this.forcedValue(ir);
		}
		region.clusters = [region.spaces.slice()];
	}
	
	//For filtering
	this.introducedXsByRegion = initializeArrayList(this.regionsNumber);
	this.introducedOsByRegion = initializeArrayList(this.regionsNumber);
	this.raisedMinsByRegion = initializeArrayList(this.regionsNumber);
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)

SolverShimaguni.prototype.getRegion = function(ix, iy) {
	return this.regions[this.regionArray[iy][ix]];
}

SolverShimaguni.prototype.getRegionIndex = function(ix, iy) {
	return this.regionArray[iy][ix];
}

SolverShimaguni.prototype.forcedValue = function(p_ir) {
	return this.regions[p_ir].forcedVal;
}

SolverShimaguni.prototype.getSpaceCoordinates = function(p_indexRegion,p_indexSpace) {
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverShimaguni.prototype.isPossibleValue = function(p_indexRegion, p_value) {
	return this.regions[p_indexRegion].possibleValues[p_value-1];
}

SolverShimaguni.prototype.setPossibleValueTrue = function(p_indexRegion, p_value) {
	this.regions[p_indexRegion].possibleValues[p_value-1] = true;
}

SolverShimaguni.prototype.setPossibleValueFalse = function(p_indexRegion, p_value) {
	this.regions[p_indexRegion].possibleValues[p_value-1] = false;
}

// Contact
SolverShimaguni.prototype.getContact = function(p_i, p_j) {return (p_j > p_i ? this.contactTriangle[p_j][p_i] : this.contactTriangle[p_i][p_j]);}

SolverShimaguni.prototype.validateContact = function(p_i, p_j) {
	if (!this.getContact(p_i, p_j)) {
		this.regions[p_i].contact.push(p_j);
		this.regions[p_j].contact.push(p_i);
		if (p_j > p_i) this.contactTriangle[p_j][p_i] = true;
			else this.contactTriangle[p_i][p_j] = true;
	}
}

//Getter : answer
SolverShimaguni.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

//--------------
// Input

SolverShimaguni.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverShimaguni.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {	
	return this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverShimaguni.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverShimaguni.prototype.emitPassRegion = function(p_indexRegion) {
	generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.passEventsSafe(generatedEvents, p_indexRegion); 
}

SolverShimaguni.prototype.makeMultiPass = function() {
	this.multiPassSafe(this.methodsSetMultipass);
}

//--------------------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_solveEvent) {
		if (p_solveEvent.kind == KIND.SYMBOL) {
			return p_solver.putNew(p_solveEvent.x,p_solveEvent.y, p_solveEvent.symbol);
		} else {
			return p_solver.banValue(p_solveEvent.indexRegion, p_solveEvent.valueToBan);
		}
	}
}

SolverShimaguni.prototype.putNew = function(p_x, p_y, p_symbol) {
	if (p_symbol == this.answerArray[p_y][p_x]) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != FILLING.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	var region = this.getRegion(p_x,p_y);
	this.answerArray[p_y][p_x] = p_symbol;
	if (p_symbol == FILLING.YES) {
		region.YES++;
		region.UNDEFs--;
	}
	else {
		region.freshClusters = false;
		region.NOs++;
		region.UNDEFs--;
	}
	return EVENT_RESULT.SUCCESS;
}


SolverShimaguni.prototype.banValue = function(p_indexRegion, p_value) {
	var region = this.regions[p_indexRegion];
	if (region.spaces.length < p_value || !this.isPossibleValue(p_indexRegion, p_value)) {
		return EVENT_RESULT.HARMLESS;
	}
	if (region.forcedValue == p_value) {
		return EVENT_RESULT.FAILURE;
	}
	if (region.forcedValue > 0) {
		return EVENT_RESULT.HARMLESS;
	}
	var newMin = region.minVal;
	var newMax = region.maxVal;
	if (p_value == region.minVal) {
		if (p_value == region.maxVal) {
			return EVENT_RESULT.FAILURE;
		}
		do {
			newMin++;
		} while (!this.isPossibleValue(p_indexRegion,newMin));
	}
	if (p_value == region.maxVal) {
		do {
			newMax--;
		} while (!this.isPossibleValue(p_indexRegion,newMax));
	}
	region.maxVal = newMax;
	region.minVal = newMin;
	this.setPossibleValueFalse(p_indexRegion,p_value);
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind == KIND.SYMBOL) {
			p_solver.undoSpaceEvent(p_eventToUndo);
		}
		else {
			p_solver.undoNumberBanEvent(p_eventToUndo);
		}
	}
}

SolverShimaguni.prototype.undoSpaceEvent = function(p_event) {
	const region = this.regions[this.regionArray[p_event.y][p_event.x]];
	region.freshClusters = false;
	this.answerArray[p_event.y][p_event.x] = FILLING.UNDECIDED;
	region.UNDEFs++;
	if (p_event.symbol == FILLING.YES) {
		region.YES--;		
	} else {
		region.NOs--;
	}
}

SolverShimaguni.prototype.undoNumberBanEvent = function(p_event) {
	const region = this.regions[p_event.indexRegion];
	this.setPossibleValueTrue(p_event.indexRegion,p_event.valueToBan);
	if (p_event.valueToBan < region.minVal) {
		region.minVal = p_event.valueToBan;
	}
	if (p_event.valueToBan > region.maxVal) {
		region.maxVal = p_event.valueToBan;
	}
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Shimaguni"}];
		var region;
		for (var irc = 0 ; irc < p_solver.regions.length ; irc++) {
			region = p_solver.regions[irc];
			if (region.forcedVal > 0) {
				listQSEvts.push(new NumberBanEvent(irc, region.forcedVal)); 
			}
			if (region.size == 1) {
				listQSEvts.push(new NumberBanEvent(irc, 1));
			}
		};
		p_solver.regions.forEach(region => {
			if ((region.size == region.forcedVal) || (region.size == 1)) {
				region.spaces.forEach(space =>
					{listQSEvts.push(new SpaceEvent(space.x, space.y, FILLING.YES))}
				);
			}
		});		
		return listQSEvts;	
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
				tryToAddArrayListData(p_solver.introducedOsByRegion, ir, {x : x, y : y});
				p_solver.existingNeighborsCoorsDirections(x, y).forEach(coors => {
					if (p_solver.getRegionIndex(coors.x, coors.y) != ir) {
						p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, FILLING.NO));
					}
				});
				if ((region.YES == p_solver.forcedValue(ir)) || (region.YES == region.maxVal)) {
					region.spaces.forEach(space => {
						if (p_solver.answerArray[space.y][space.x] ==  FILLING.UNDECIDED) {
							p_listEventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO));
					}});
					region.contact.forEach(irc => p_listEventsToApply.push(new NumberBanEvent(irc,region.YES)));
				}
			}
			if (symbol == FILLING.NO) {
				tryToAddArrayList(p_solver.introducedXsByRegion, ir);
				var potentialOs = region.YES + region.UNDEFs;
				if (((potentialOs) == p_solver.forcedValue(ir)) || 
					((potentialOs) == region.minVal)) {
					p_listEventsToApply = p_solver.fillRegionWith(p_listEventsToApply, ir, FILLING.YES);
					p_listEventsToApply = p_solver.banAllAdjacentsFromRegion(p_listEventsToApply, ir, potentialOs);
				}
			}		
		} else { // Ban a value
			ir = p_eventBeingApplied.indexRegion;
			tryToAddArrayList(p_solver.raisedMinsByRegion, ir); 
			region = p_solver.regions[p_eventBeingApplied.indexRegion];
			if (region.minVal == region.maxVal) {
				if ((region.YES + region.UNDEFs) == region.minVal) {
					p_listEventsToApply = p_solver.fillRegionWith(p_listEventsToApply, ir, FILLING.YES);
				}
				p_listEventsToApply = p_solver.banAllAdjacentsFromRegion(p_listEventsToApply, ir, region.minVal);
			} //endif "one possible value"
		}
		return p_listEventsToApply;
	}
}

//From this point to the end of the while loop, all clusters MUST be fresh AND max must be updated.
filterClustersClosure = function(p_solver) {
	return function() {
		var eventsToApply = [];
		var ok = true;
		
		p_solver.introducedXsByRegion.list.forEach(ir => {
			region = p_solver.regions[ir];
			//Updates clusters ; then ban clusters that don't contain a filled space
			if (!region.freshClusters) {
				p_solver.updateClustersRegion(ir);
				if (region.indexClusterWithFill == CLUSTER_WITH_FILL.MULTI) {
					ok = false;
					autoLogTryToPutNewGold("NOOOOO ! (region " + ir + " has more than one cluster with filled space)");
				} else if (region.indexClusterWithFill != CLUSTER_WITH_FILL.NOT_FOUND) {
					for(var ic = 0;ic < region.clusters.length; ic++) {
						if (ic != region.indexClusterWithFill) {
							region.clusters[ic].forEach(
								space => {eventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO))}
							);
						}
					}
				}
			}
			//Put NOs in spaces that would have become too small
			// Also, find the max size of clusters
			var maxClusterSize = 0;
			region.clusters.forEach(listCluster => {
				if (listCluster.length < region.minVal) {
					listCluster.forEach(space => {eventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO))});
				}
				if (listCluster.length > maxClusterSize) {
					maxClusterSize = listCluster.length;
				}
			});
			//Events to ban values between the actual max and the (max size of cluster + 1)
			for(var value = maxClusterSize+1 ; value <= region.maxVal ; value++) {
				eventsToApply.push(new NumberBanEvent(ir, value));
			}
		});
		
		if (!ok) {
			return EVENT_RESULT.FAILURE;
		}
		
		p_solver.introducedOsByRegion.list.forEach(introduced => {
			var ir = introduced.index;
			var region = p_solver.regions[ir];
			if (!region.freshClusters) {
				p_solver.updateClustersRegion(ir);
			}
			// If this is our very first O placed (or several of 'em) in this region, an update is mandatory so a "cluster with fill" is found.
			var clusterBelong = (region.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND) ? p_solver.clusterArray[introduced.y][introduced.x] : region.indexClusterWithFill;
			//var clusterBelong = region.indexClusterWithFill;
			// Ban clusters that don't contain a filled space
			if (clusterBelong == CLUSTER_WITH_FILL.MULTI) {
				ok = false;
				autoLogTryToPutNewGold("NOOOOO ! (region "+ir+" has more than one cluster with filled space)");
			} else {
				for(var ic = 0;ic < region.clusters.length; ic++) {
					if (ic != clusterBelong) {
						region.clusters[ic].forEach(
							space => {eventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO))}
						);
					}
				}
			}
			//Events to ban values between the min and the (number of Os - 1)
			for(var value = region.minVal;value < region.YES;value++) {
				eventsToApply.push(new NumberBanEvent(ir, value));
			}
		});
		
		if (!ok) {
			return EVENT_RESULT.FAILURE;
		}
		
		//From this point to the end of the filter function, all clusters MUST be fresh AND max must be updated.
		
		//If the min has been raised, ban clusters that have become too small.
		p_solver.raisedMinsByRegion.list.forEach(ir => {
			region = p_solver.regions[ir];
			if (!region.freshClusters) {
				p_solver.updateClustersRegion(ir); // Okay ; there MAY be situations where the minimum of a region has to be raised without an O or a X put in (because smaller values are banned due to being present in surrounding regions) and the clusters are still outdated (because of Os and Xs put here in previous passes)
			} // So... let's update !
			region.clusters.forEach(listCluster => {
				if (listCluster.length < region.minVal) {
					listCluster.forEach(space => {eventsToApply.push(new SpaceEvent(space.x, space.y, FILLING.NO))});
				}
			});	
			//Peculiar case : no X has been added recently (so no too small clusters detected to ban) yet we have to fill a region with Os since we have that many spaces left.
			//Detected by Shimaguni 188.
			if ((region.minVal == region.maxVal) && (region.minVal == (region.size - region.NOs))) {
				eventsToApply = p_solver.fillRegionWith(eventsToApply, ir, FILLING.YES);
			}
		});
		
		p_solver.cleanByRegionLists();
		
		if (ok) {
			return eventsToApply;
		} else {
			return EVENT_RESULT.FAILURE;
		}
	}
}

abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanByRegionLists();
	}
}

SolverShimaguni.prototype.cleanByRegionLists = function() {
	this.introducedXsByRegion = initializeArrayList(this.regionsNumber);
	this.introducedOsByRegion = initializeArrayList(this.regionsNumber);
	this.raisedMinsByRegion = initializeArrayList(this.regionsNumber);
}

/**
Returns a list of planned events : plans to fill the remaining undecided spaces in the region. 
*/
SolverShimaguni.prototype.fillRegionWith = function(p_eventsToApply, p_indexRegion, p_symbol) {
	var region = this.regions[p_indexRegion];
	region.spaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == FILLING.UNDECIDED) {
			p_eventsToApply.push(new SpaceEvent(space.x, space.y, p_symbol));
		}
	});
	return p_eventsToApply;
}

SolverShimaguni.prototype.banAllAdjacentsFromRegion = function(p_eventsToApply, p_indexRegion, p_valueToBan) {
	this.regions[p_indexRegion].contact.forEach(irc => {
		p_eventsToApply.push(new NumberBanEvent(irc,p_valueToBan));
	});
	return p_eventsToApply;
}

const CLUSTER_WITH_FILL= {
	NOT_FOUND:-1,
	MULTI:-2
}
const NOT_CLUSTERED = -1;

/**
Draws all clusters of a region that needs to be updated ; alters region ; returns the cluster that contains an O... should be only one .
The "index cluster with fill" of the region becomes the index of the cluster that is filled (if there is only one), multi (if there are several) or "not found" (if there are none)
*/
SolverShimaguni.prototype.updateClustersRegion = function(p_indexRegion) {
	var region = this.regions[p_indexRegion];
	region.spaces.forEach(space => {this.clusterArray[space.y][space.x] = NOT_CLUSTERED}); 
	region.indexClusterWithFill = CLUSTER_WITH_FILL.NOT_FOUND;
	var clustersList = [];
	var oneCluster;
	var indexClusterNow;
	region.spaces.forEach(space => {
		oneCluster = this.fillCluster(space.x,space.y,p_indexRegion,clustersList.length);
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
	region.freshClusters = true;
	region.clusters = clustersList;
}

//Looks for all unclustered spaces, updates them to the value and returns the list of spaces updated.
// [] if no cluster (we try to cluster a space with an X or an already clustered space)
SolverShimaguni.prototype.fillCluster = function(p_x,p_y,p_indexRegion,p_value) {
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

// Some ArrayList methods

//TODO Maybe a class should be done of it... or maybe not.
function initializeArrayList(p_length) {
	var array = [];
	for(var i=0;i<p_length;i++) {
		array.push(false);
	}
	return{array:array,list:[]};
}

function tryToAddArrayList(p_arrayList,p_index) {
	if (!p_arrayList.array[p_index]) {
		p_arrayList.list.push(p_index);
		p_arrayList.array[p_index] = true;
	}
}

//Note : "index" is an injected field for data.
function tryToAddArrayListData(p_arrayList,p_index,p_data) {
	if (!p_arrayList.array[p_index]) {
		var data = p_data;
		data.index = p_index;
		p_arrayList.list.push(data);
		p_arrayList.array[p_index] = true;
	}
}

// ---------------------
// Pass methods

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

SolverShimaguni.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.regions[p_indexRegion].spaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == FILLING.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([new SpaceEvent(space.x, space.y, FILLING.YES), new SpaceEvent(space.x, space.y, FILLING.NO)]);
		}			 
	});
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

/**
Compares two space events for sorting (left is "superior" : 1 ; right is "superior" : -1)
*/
function compareSolveEvents(p_event1, p_event2) {
	return commonComparisonMultiKinds([KIND.SYMBOL, KIND.VALUE], [[p_event1.y, p_event1.x, p_event1.symbol],
	[p_event2.y, p_event2.x, p_event2.symbol], [p_event1.indexRegion, p_event1.valueToBan], [p_event2.indexRegion, p_event2.valueToBan]], p_event1.kind, p_event2.kind);
}

function namingCategoryClosure(p_solver) {
	return function (p_indexRegion) {
		const firstSpaceRegion = p_solver.getSpaceCoordinates(p_indexRegion, 0);
		return "Region "+ p_indexRegion + " (" + firstSpaceRegion.x +" "+ firstSpaceRegion.y + ")"; 
	}
}


// ---------------------
// Multipass methods

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		var values = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			if (p_solver.regions[i].UNDEFs > 0) {
				indexList.push(i);
			}
		}
		indexList.sort(function(p_i1, p_i2) {
			return p_solver.regions[p_i1].UNDEFs-p_solver.regions[p_i2].UNDEFs;
		});
		return indexList;
	}
}