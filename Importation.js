var nbScriptsLoaded = 0;
var totalNbScriptsToLoad = 0;

function increment() {
  nbScriptsLoaded ++;
  if (nbScriptsLoaded == totalNbScriptsToLoad) {
	main(); 	  
  }
}

function loadScriptsClosure(p_array) {
	return function() {
		totalNbScriptsToLoad += p_array.length;
		p_array.forEach(script => {
			loadMyScriptPrivate(script);
		});
	}
}

function loadMyScriptPrivate(p_script) {
	  const scrip = document.createElement('script');
	  document.body.appendChild(scrip);
	  scrip.src = p_script;
	  scrip.addEventListener('load', increment);
}

function loadMyScript(p_script) {
	totalNbScriptsToLoad ++;
	loadMyScriptPrivate(p_script);
}

loadScriptsSolving = loadScriptsClosure(["../miscSolving/GeneralSolver.js", "../miscSolving/SolvingMethodPacks.js"]); // Must be charged first since basically that calls constructors everything depends upon GeneralSolver
loadScriptsDirections = loadScriptsClosure(["../miscSolving/Directions.js", "../miscSolving/DirectionFunctions.js"]);
loadScriptsGeneric = loadScriptsClosure(["../WallGrid.js", "../Grid.js",
"../commonSaveAndLoad.js", "../commonEncodingDecoding.js",
"../DrawableItem.js", "../Drawer.js",
"../commonInput.js", "../commonActionManager.js", 
"../CommonHTMLMenu.js",
"../Logs.js"]);
loadScriptsLocal = loadScriptsClosure(["drawing.js", "mainSolver.js", "inputSolver.js"]);
loadScriptsLoop = loadScriptsClosure(["../LoopSolver/drawing.js", "../LoopSolver/LoopEvent.js", "../LoopSolver/CompoundLinkEvent.js", "../LoopSolver/LoopSolver.js", "../LoopSolver/Constants.js"]);
loadScriptsAdjacency = loadScriptsClosure(["../miscSolving/AdjacencyCheck.js", "../miscSolving/AdjacencyLimit.js", "../miscSolving/GeographicalSolver.js"]);

function loadScriptCheckCollection() { loadMyScript("../miscSolving/CheckCollection.js"); } // For filters 
function loadScriptConstants() { loadMyScript("../miscSolving/Constants.js"); }
function loadScriptFences() { loadMyScript("../miscSolving/Fences.js"); }
function loadScriptSpacesSelection() { loadMyScript("../miscSolving/SpaceNumeric.js"); }

loadScriptsLoopRegion = loadScriptsClosure(["../LoopSolver/RegionLoopSolver.js", "../LoopSolver/RegionJunctionEvent.js"]);
