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
"../ColourBank.js", "../DrawableItem.js", "../Drawer.js",
"../commonInput.js", "../commonCanvasActions.js", "../commonHTMLSolverInterface.js", "../commonHTMLItemGenerations.js", "../ActionsManagersSet.js",
"../CommonHTMLMenu.js",
"../Logs.js"]);
addScriptsLocal = addScriptsClosure(["drawing.js", "mainSolver.js", "inputSolver.js"]);
addScriptsLoop = addScriptsClosure(["../LoopSolver/drawing.js", "../LoopSolver/LoopEvent.js", "../LoopSolver/LoopSolver.js", "../LoopSolver/Constants.js", "../LoopSolver/PassCategories.js", "../LoopSolver/CommonHTMLLoopDisplay.js"]);
addScriptsAdjacency = addScriptsClosure(["../miscSolving/AdjacencyCheck.js", "../miscSolving/AdjacencyLimit.js", "../miscSolving/GeographicalSolver.js"]);
addScriptsPurificator = addScriptsClosure(["../miscSolving/GeneralPurificator.js", "../miscSolving/PurificatorSymbolArray.js"]); 
// Yeah, not all solvers use symbol arrays... but since most of them use I guess we can include the PurificatorSA within addScriptsPurificator.

function addScriptCheckCollection() { addScript("../miscSolving/CheckCollection.js"); } // For filters 
function addScriptConstants() { addScript("../miscSolving/Constants.js"); }
function addScriptFences() { addScript("../miscSolving/Fences.js"); }
function addScriptNonBinarySpaces() { addScript("../miscSolving/SpaceNumeric.js"); }
function addScriptInputSpacesSelection() { addScript("../miscSolving/InputSpacesSelection.js"); }
function addScriptClusterFencesManagement() { addScript("../miscSolving/ClusterFencesManager.js"); }
function addScriptClusterManagement() { addScript("../miscSolving/ClusterManager.js"); }
function addScriptMisc() { addScript("../Misc.js"); }
function addScriptsCollectionShingokiGeradeweg() {
	addScript("../LoopSolver/ShingokiGeradeweg/SolveEvent.js");
	addScript("../LoopSolver/ShingokiGeradeweg/Getters.js");
	addScript("../LoopSolver/ShingokiGeradeweg/DosUndosDeductions.js");
	addScript("../LoopSolver/ShingokiGeradeweg/Pass.js");
}

addScriptsLoopRegion = addScriptsClosure(["../LoopSolver/RegionLoopSolver.js", "../LoopSolver/RegionJunctionEvent.js"]);