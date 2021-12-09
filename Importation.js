var nbScriptsLoaded = 0;
var scriptsToLoad = [];

function increment() {
  nbScriptsLoaded ++;
  if (nbScriptsLoaded == scriptsToLoad.length) {
	autoLogImport("Load done :) ");
	main(); 	  
  } else {
	  addAScriptPrivate(scriptsToLoad[nbScriptsLoaded]);
  }
}

function addScriptsClosure(p_array) {
	return function() {
		p_array.forEach(script => {
			addScript(script);
		});
	}
}

function addAScriptPrivate(p_script) {
	  const scrip = document.createElement('script');
	  document.body.appendChild(scrip);
	  scrip.src = p_script;
	  scrip.addEventListener('load', increment);
}

function addScript(p_script) {
	scriptsToLoad.push(p_script);
}

function startScriptLoading() {
	addAScriptPrivate(scriptsToLoad[0]);	
}

addScriptsSolving = addScriptsClosure(["../miscSolving/GeneralSolver.js", "../miscSolving/GeneralSolverFunctions.js", "../miscSolving/GeneralSolverInterface.js", "../miscSolving/SolvingMethodPacks.js"]); // Must be charged first since basically that calls constructors everything depends upon GeneralSolver
addScriptsDirections = addScriptsClosure(["../Directions.js", "../DirectionFunctions.js", "../miscSolving/DirectionFunctions.js"]);
addScriptsGeneric = addScriptsClosure(["../WallGrid.js", "../Grid.js", "../LinkGrid.js",
"../commonSaveAndLoad.js", "../commonEncodingDecoding.js",
"../DrawableItem.js", "../Drawer.js",
"../commonInput.js", "../commonActionManager.js", "../commonHTMLSolverInterface.js", "../commonHTMLItemGenerations.js",
"../CommonHTMLMenu.js",
"../Logs.js"]);
addScriptsLocal = addScriptsClosure(["drawing.js", "mainSolver.js", "inputSolver.js"]);
addScriptsLoop = addScriptsClosure(["../LoopSolver/drawing.js", "../LoopSolver/LoopEvent.js", "../LoopSolver/LoopSolver.js", "../LoopSolver/Constants.js", "../LoopSolver/PassCategories.js", "../LoopSolver/CommonHTMLLoopDisplay.js"]);
addScriptsAdjacency = addScriptsClosure(["../miscSolving/AdjacencyCheck.js", "../miscSolving/AdjacencyLimit.js", "../miscSolving/GeographicalSolver.js"]);

function addScriptCheckCollection() { addScript("../miscSolving/CheckCollection.js"); } // For filters 
function addScriptConstants() { addScript("../miscSolving/Constants.js"); }
function addScriptFences() { addScript("../miscSolving/Fences.js"); }
function addScriptNonBinarySpaces() { addScript("../miscSolving/SpaceNumeric.js"); }
function addScriptInputSpacesSelection() { addScript("../miscSolving/InputSpacesSelection.js"); }
function addClusterFencesManagement() { addScript("../miscSolving/ClusterFencesManager.js"); }
function addClusterManagement() { addScript("../miscSolving/ClusterManager.js"); }
function addMisc() { addScript("../Misc.js"); }

addScriptsLoopRegion = addScriptsClosure(["../LoopSolver/RegionLoopSolver.js", "../LoopSolver/RegionJunctionEvent.js"]);