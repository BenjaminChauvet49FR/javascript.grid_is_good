// Methods that are used by many inputs

/**
View the numbers of puzzle list
*/ 
// Warning : only properties of local storage that start with "puzzleNamedListToSort" are taken into consideration. Otherwise, local storage has to be looked into !
function viewPuzzleList(p_puzzleName) {
    var answer = "Préfixe : "+p_puzzleName+" \n";
    var numericListToSort = [];
	var puzzleNamedListToSort = [];
	var suffix, intToTest;
    const baseString = "grid_is_good_" + p_puzzleName; 
	var conditionalComma;
	var conditionalBackLine="\n";
    for (var i = 0, len = localStorage.length; i < len; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(baseString)) {
			suffix = key.substring(baseString.length);
			//intToTest = parseInt(suffix); // Credits for NaN test : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/isNaN 
            //if (!isNaN(intToTest)) { // By the way, "NaN" are produced by parseInt. Good to know for when solving.
				// MISTAKE : go here : https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
			if (!isNaN(suffix) && suffix != "") { // NB : isNaN("") == true, yet parseInt("") == NaN
				intToTest = parseInt(suffix);
				numericListToSort.push(intToTest);
			} else {
				puzzleNamedListToSort.push(suffix);
			}
        } 
    }
    numericListToSort = numericListToSort.sort(function (a, b) {
        return a - b;
    });
	if (numericListToSort.length > 0) {
		answer += "Valeurs numériques : "
		conditionalComma = "";
		for (var i = 0; i < numericListToSort.length; i++) {
			answer += (conditionalComma + numericListToSort[i]);
			conditionalComma = ", ";
		}
		conditionalBackLine = "\n";
	} 
	puzzleNamedListToSort = puzzleNamedListToSort.sort();
	if (puzzleNamedListToSort.length > 0) {
		answer += conditionalBackLine+"Valeurs non numériques : ";
		conditionalComma = "";
		var start = 0;
		if (puzzleNamedListToSort[0] == "") {// Since the 0 entry may be different, no need for a conditionalComma
			answer += "<valeur vide>"
			conditionalComma = ", ";
			start = 1;
		}
		for (var i = start; i < puzzleNamedListToSort.length; i++) {
			answer += (conditionalComma + puzzleNamedListToSort[i]);
			conditionalComma = ", ";
		}
		conditionalBackLine = "\n";
	} 
    alert(answer);
}

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
*/
loadAction = function(p_canvas, p_drawer, p_solver, p_puzzleTypeName, p_dataName, p_extraProperties) { // Extra properties : properties for the puzzle not saved in the 'value' string.
	const localStorageName = getLocalStorageName(p_puzzleTypeName, p_dataName);
	const loadedString = localStorage.getItem(localStorageName);
	if (loadedString) {
		loadPuzzle(p_canvas, p_drawer, p_solver, loadedString, p_extraProperties); // Naming constraint !!! Each puzzle that uses "input" should use this method.
	} else {
        alert("Le stockage local n'a pas de propriété nommée '" + localStorageName + "'.");
    }
}

// Revolution ! Should be changed for all puzzles ! And the one above should be removed.
loadActionCOMPLETE = function(p_canvas, p_drawer, p_gameItems, p_puzzleTypeName, p_dataName, p_extraProperties) { 
	const localStorageName = getLocalStorageName(p_puzzleTypeName, p_dataName);
	const loadedString = localStorage.getItem(localStorageName);
	if (loadedString) {
		loadPuzzleCOMPLETE(p_canvas, p_drawer, p_gameItems, loadedString, p_extraProperties); // Naming constraint !!! Each puzzle that uses "input" and has purificators should use this method.
	} else {
        alert("Le stockage local n'a pas de propriété nommée '" + localStorageName + "'.");
    }
}

savePurifiedAction = function(p_purificator, p_puzzleTypeName, p_dataName, p_extraProperties) {
	const savePureSuffix = "_pure";
	const localStorageName = getLocalStorageName(p_puzzleTypeName, p_dataName) + (p_dataName.endsWith(savePureSuffix) ? "" : savePureSuffix);
	var letsSave = true;
	if (localStorage.hasOwnProperty(localStorageName)) {
		if (!confirm("Le stockage local a déjà une propriété nommée '" + localStorageName + "'. L'écraser ?")) {
            letsSave = false;
        }
	}
	if (letsSave) {
		localStorage.setItem(localStorageName, purifiedPuzzleToString(p_purificator, p_extraProperties)); // Naming constraint !!! Each puzzle that uses "input" and has purificators should use this method.
	}
}