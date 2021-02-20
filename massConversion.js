// This script should be copy-pasted and used in the console when running the editor and not included in any page !

function massConversion() {
	// Full name
	
	puzzleName = "CountryRoad";
	baseString = "grid_is_good_" + puzzleName; 
    for (var i = 0, len = localStorage.length; i < len; i++) {
        name = localStorage.key(i);
        if (name.startsWith(baseString)) {
			stringPuzzleOld = localStorage.getItem(name);
			loadedItemOld = stringToWallAndNumbersPuzzle(stringPuzzleOld); // former puzzle -> string method
			puzzleString = puzzleRegionIndicationsToString(loadedItemOld.wallArray, loadedItemOld.numberArray); // new string -> puzzle method
			localStorage.setItem(name, puzzleString);
        } 
    }
	
	// Isolated test (but what if the console runs in strict mode, with 'const' and 'var' items required here and there ? Well, is it even possible ?)
	/*name = "grid_is_good_Shimaguni87";
	newName = "grid_is_good_Shimaguni"
	stringPuzzleOld = localStorage.getItem(name);
	loadedItemOld = stringToWallAndNumbersPuzzle(stringPuzzleOld); // former puzzle -> string method
	puzzleString = puzzleRegionIndicationsToString(loadedItemOld.wallArray, loadedItemOld.numberArray); // new string -> puzzle method
	localStorage.setItem(newName, puzzleString);*/
}
 
// Former grid_is_good_Heyawake676 : 24 14 232222323001000010101000001001001001222230101000223223223223010012323222000101001001010010011000222323223001010010013222000100101223232232230000000100101001010101010000222300123223232323012222000122300100100101010000222300122322322323232222010122323001000100010100232300101223222322232322010100101001010010010100010100101001010010010100 2 0 2 7 0 0 9 0 2 12 0 3 17 0 2 19 0 3 21 0 2 3 1 3 12 2 2 14 2 4 0 3 4 9 3 3 21 3 3 0 5 4 20 5 5 9 6 3 16 6 1 18 6 3 0 8 1 7 8 3 10 8 2 16 8 2 20 8 2 4 9 1 0 10 1 9 10 3 12 10 3 16 10 2 4 11 3 7 11 3 2 12 1 9 12 1 12 12 2 14 12 2 20 12 2 22 12 1
// Now : 							 24 14 232222323001000010101000001001001001222230101000223223223223010012323222000101001001010010011000222323223001010010013222000100101223232232230000000100101001010101010000222300123223232323012222000122300100100101010000222300122322322323232222010122323001000100010100232300101223222322232322010100101001010010010100010100101001010010010100 X 2 0 2 3 2 3 2 X 3 X 2 4 4 XX 3 XX 3 4 XX 5 3 XX 1 3 1 3 2 X 2 2 1 1 XX 3 3 2 XX 3 3 X 1 1 2 2 X 2 1