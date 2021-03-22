// ------------------------------------------
// "String 64".
// 0-9 : 0-9
// 10-35 : A-Z
// 36-61 : a-z
// 62, 63 : @$ (memo : $ = regexp end)

// https://www.w3schools.com/jsref/jsref_fromcharcode.asp
// http://www.asciitable.com/
// https://www.w3schools.com/jsref/jsref_charcodeat.asp

const END_OF_DECODING_STREAM = -1;
const NOT_DECODED_CHARACTER = -2;
const NOT_ENCODED_VALUE = "&";

// ------------------------------------------
// Character <-> 0 to 64 integer methods

function encode64ToCharacter(p_digit0to63) { 
	if (p_digit0to63 <= 9) {
		return String.fromCharCode(CONST_CHAR_CODES._0+p_digit0to63);
	} else if (p_digit0to63 <= 35) {
		return String.fromCharCode(CONST_CHAR_CODES._A+p_digit0to63-10);
	} else if (p_digit0to63 <= 61) {
		return String.fromCharCode(CONST_CHAR_CODES._a+p_digit0to63-36);
	} else if (p_digit0to63 == 62) {
		return "@";
	} else if (p_digit0to63 == 63) {
		return "$";
	}
	return NOT_ENCODED_VALUE;
}

const CONST_CHAR_CODES = {
	_0 : "0".charCodeAt(0),
	_9 : "9".charCodeAt(0),
	_A : "A".charCodeAt(0),
	_Z : "Z".charCodeAt(0),
	_a : "a".charCodeAt(0),
	_z : "z".charCodeAt(0),
}

function decode64FromCharacter(p_char) {
	var value = p_char.charCodeAt(0);
	if (value >= CONST_CHAR_CODES._0 && value <= CONST_CHAR_CODES._9) {
		return value - (CONST_CHAR_CODES._0);
	}
	if (value >= CONST_CHAR_CODES._A && value <= CONST_CHAR_CODES._Z) {
		return value - (CONST_CHAR_CODES._A) + 10;
	}
	if (value >= CONST_CHAR_CODES._a && value <= CONST_CHAR_CODES._z) {
		return value - (CONST_CHAR_CODES._a) + 36;
	}
	if (p_char == '@') {
		return 62;
	}
	if (p_char == '$') {
		return 63;
	}
	return NOT_DECODED_CHARACTER;
}

// ------------------------------------------
// Streams classes

function StreamEncodingString64() {
	this.string = "";
}

StreamEncodingString64.prototype.encode = function(p_value) {
	if (p_value >= 64) {
		this.string += "[";
		var value = p_value;
		var value0to64;
		var stringVal = "";
		while (value > 0) {
			value0to63 = value % 64; 
			stringVal = encode64ToCharacter(value0to63) + stringVal;
			value = Math.floor(value / 64);
		}
		this.string += stringVal;
		this.lastNumberAbove64 = true;
	} else {
		this.closeNumber();
		this.string += encode64ToCharacter(p_value);
		this.lastNumberAbove64 = false;
	}
}

StreamEncodingString64.prototype.closeNumber = function () {
	this.string += (this.lastNumberAbove64 ? "]" : "");
	this.lastNumberAbove64 = false;
}

StreamEncodingString64.prototype.addString = function(p_string) {
	this.closeNumber();
	this.string += p_string;
}

// Unlike other methods, this one is not closing
StreamEncodingString64.prototype.getString = function(p_string) {
	this.closeNumber();
	return this.string; 
}

function StreamDecodingString64(p_string) {
	this.string = p_string;
	this.index = 0;
}

StreamDecodingString64.prototype.decodeWithPrefix = function() {
	return this.decode(true);
}

StreamDecodingString64.prototype.decode = function (p_withPrefix) {
	if (this.index == this.string.length) {
		return END_OF_DECODING_STREAM;
	}
	var value = 0;
	var preNumber = "";
	while (this.index < this.string.length && this.string.charAt(this.index) != "[" && decode64FromCharacter(this.string.charAt(this.index)) == NOT_DECODED_CHARACTER) {
		preNumber += this.string.charAt(this.index);
		this.index++;
	}
	if (this.string.charAt(this.index) == "[") {
		this.index++;
		while (this.index < this.string.length && this.string.charAt(this.index) != "[" && this.string.charAt(this.index) != "]") {
			value *= 64;
			value += decode64FromCharacter(this.string.charAt(this.index));
			this.index++;
		}
		if (this.index < this.string.length && this.string.charAt(this.index) == "]") {
			this.index++;
		}
		return {prefix : preNumber, value : value} ;
	} else {
		value = decode64FromCharacter(this.string.charAt(this.index));
		this.index++;
		if (p_withPrefix) {
			return {prefix : preNumber, value : value};	
		} else {
			return value;
		}
	}
}

StreamDecodingString64.prototype.getNextIndex = function() {
	return this.index;
}


// For test :
/* encode = new StreamEncodingString64(); 
encode.encode(36); encode.encode(65); encode.encode(3969); encode.encode(4095); encode.encode(4096);
encode.encode(262143); encode.encode(524352); encode.encode(17); encode.encode(9); encode.encode(35);
decode = new StreamDecodingString64("a[11[@1[$$[100]b12--34_121")
decode.decode() // (repeat) */

// ------------------------------------------

// Functions of encoding/decoding :
// "Binary block 7"
// For binary stream. Alternance of "position characters" and "value characters". A "position" is the number (including 0) of 0s  between the end of the last block or the beginning of the block. A block is always made of an 1 and the 6 following bits and is valued as the value of the 6 bits.
// 0000001001010100001000010111010 => 6A023T (1001010 => 10 (déc) => 'A') (1000010 => 2 (déc) => '2') (1011101 => 29 (déc) => 'T')

function StreamBinaryBlock7Encoder() {
	this.privateString = ""; // Only base 64 digits so no stream.
	this.numberBitsInBlock = -1;
	this.numberBitsSinceLastBlock = 0;
	this.value0to63 = 0;
}

StreamBinaryBlock7Encoder.prototype.encode = function(p_bit) {
	if (this.numberBitsInBlock >= 0) {
		this.value0to63 *= 2;
		if (p_bit) {
			this.value0to63++;
		}
		this.numberBitsInBlock++;
		if (this.numberBitsInBlock == 6) {
			this.privateString += encode64ToCharacter(this.value0to63);
			this.numberBitsInBlock = -1;
			this.numberBitsSinceLastBlock = 0;
		}
	} else if (p_bit) {
		this.numberBitsInBlock = 0;
		this.value0to63 = 0;
		this.privateString += encode64ToCharacter(this.numberBitsSinceLastBlock);
	} else {
		this.numberBitsSinceLastBlock++;
	}
}

StreamBinaryBlock7Encoder.prototype.getString = function() {
	if (this.numberBitsInBlock > 0) { // If at least the 1st digit of a block of 6 digits was written, fill with zeroes.
		for (var i = this.numberBitsInBlock ; i < 6 ; i++) {
			this.value0to63 *= 2;
		}
		this.privateString += encode64ToCharacter(this.value0to63);
	}
	this.numberBitsInBlock = -1;
	this.numberBitsSinceLastBlock = 0;
	this.value0to63 = 0;
	const answer = this.privateString;
	this.privateString = "";
	return answer;
}

// No decoder yet.

// ----
// Fully encodes values in a stream
function StreamEncodingFullBase(p_base) {
	this.privateString = ""; // Only base 64 digits so no stream. (privileges of full encoding)
	this.base = p_base;
	this.numberDigits = 0;
	this.value0to63 = 0;
	this.limitDigits = 1;
	if (this.base == 2) {
		this.limitDigits = 6;
	} else if ((this.base == 3) || (this.base == 4)) {
		this.limitDigits = 3;
	} else if (this.base <= 7) {
		this.limitDigits = 2;
	}
}

StreamEncodingFullBase.prototype.encode = function(p_digit) {
	this.value0to63 *= this.base;
	this.value0to63 += p_digit;
	this.numberDigits++;
	if (this.numberDigits == this.limitDigits) {
		this.privateString += encode64ToCharacter(this.value0to63);
		this.numberDigits = 0;
		this.value0to63 = 0;
	}
}

StreamEncodingFullBase.prototype.getString = function() {
	if (this.numberDigits > 0) {
		for (var i = this.numberDigits; i < this.limitDigits ; i++) {
			this.value0to63 *= this.base;
		}
		this.privateString += encode64ToCharacter(this.value0to63);
	}		
	const answer = this.privateString;
	this.privateString = "";
	return answer;
}

StreamDecodingFullBase = function(p_base, p_string) {
	this.base = p_base;
	this.capDigits = 1;
	if (this.base == 2) {
		this.capDigits = 6;
	} else if ((this.base == 3) || (this.base == 4)) {
		this.capDigits = 3;
	} else if (this.base <= 7) {
		this.capDigits = 2;
	}
	this.privateString = p_string;
	this.indexInString = 0; // Since the first number is consumed...
	this.arrayDigits = [];
	if (this.privateString.length != 0) {
		this.arrayDigits = arrayDigitsBase(decode64FromCharacter(this.privateString.charAt(0)), this.base, this.capDigits);
	}
	this.indexInArrayDigits = 0;
}

StreamDecodingFullBase.prototype.decode = function() {
	if (this.indexInString == this.privateString.length) {
		return END_OF_DECODING_STREAM;
	}
	const answer = this.arrayDigits[this.indexInArrayDigits];
	this.indexInArrayDigits++;
	if (this.indexInArrayDigits == this.capDigits) {
		this.indexInArrayDigits = 0;
		this.indexInString++;
		if (this.indexInString < this.privateString.length) {
			this.arrayDigits = arrayDigitsBase(decode64FromCharacter(this.privateString.charAt(this.indexInString)), this.base, this.capDigits);
		}
	}
	return answer;
}

// test : decoder = new StreamDecodingFullBase(4, "Bonjour");

arrayDigitsBase = function(p_value0to63, p_base, p_capDigits) {
	var answer = [];
	var val = p_value0to63;
	for (var i = 0; i < p_capDigits ; i++) {
		answer.push(0);
	}
	for (var i = 0 ; i < p_capDigits ; i++) {
		answer[p_capDigits-1-i] = val % p_base;
		val = Math.floor(val / p_base);
	}
	return answer;
}

StreamDecodingFullBase.prototype.getConsumedCharacters = function() {
	return (this.indexInArrayDigits == 0) ? this.indexInString : (this.indexInString+1);
}


// ----
// Encode values as they come (in base 64), including potentially null ones.
// If one value is skipped (null), add a "-"
// Two values : "--" 
// Three values or more : "_?" where ? is the number of skipped values minus 3 (0 if exactly 3 values were skipped)
StreamEncodingSparseAny = function() {
	this.privateStream = new StreamEncodingString64();
	this.nullValuesHold = 0;
}	

// Encodes a numeric value that can be anything, or null 
StreamEncodingSparseAny.prototype.encode = function(p_value) {
	if (p_value == null) {
		this.nullValuesHold++;
	} else {
		if (this.nullValuesHold >= 3) {
			this.privateStream.addString("_");
			this.privateStream.encode(this.nullValuesHold - 3);
		} else if (this.nullValuesHold == 2) {
			this.privateStream.addString("--");				
		} else if (this.nullValuesHold == 1) {
			this.privateStream.addString("-");
		}
		this.privateStream.encode(p_value);
		this.nullValuesHold = 0;
	}
}

StreamEncodingSparseAny.prototype.getString = function() {
	return this.privateStream.getString();
}
// Test : 
/*encoder = new StreamEncodingSparseAny(); 
encoder.encode(3); encoder.encode(null); encoder.encode(5); encoder.encode(null); encoder.encode(null);
encoder.encode(null); encoder.encode(null); encoder.encode(13); encoder.encode(87); encoder.encode(23);
encoder.encode(11); encoder.encode(16); encoder.encode(null); encoder.encode(null); encoder.encode(null);
encoder.encode(3); encoder.encode(null); encoder.encode(5); encoder.encode(null); encoder.encode(null);
encoder.encode(3); encoder.encode(5); encoder.encode(null); encoder.encode(null); encoder.encode(61);

*/

StreamDecodingSparseAny = function(p_string) {
	this.privateStream = new StreamDecodingString64(p_string);
	this.remainingNull = 0;
	this.reservedValue = NOT_DECODED_CHARACTER;
}	

StreamDecodingSparseAny.prototype.decode = function() {
	if (this.remainingNull == 0) {
		if (this.reservedValue != NOT_DECODED_CHARACTER) {
			const answer = this.reservedValue;
			this.reservedValue = NOT_DECODED_CHARACTER;
			return answer;
		} else {
			const val = this.privateStream.decodeWithPrefix();
			if (val == END_OF_DECODING_STREAM) {
				return END_OF_DECODING_STREAM;
			}
			switch(val.prefix) {
				case "" : return val.value; break;
				case "--" : 
					this.remainingNull = 2; 
					this.reservedValue = val.value;
				break;
				case "-" : 
					this.remainingNull = 1; 
					this.reservedValue = val.value;
				break;
				case "_" : 
					this.remainingNull = val.value + 3; 
				break;
			}
		}
	} 
	// this.remainingNull > 1 in any case here
	this.remainingNull--;
	return null;
}
// Test : 
/*decoder = new StreamDecodingSparseAny("3-5-1_2A"); 
decoder.decode();*/

StreamDecodingSparseAny.prototype.getNextIndex = function() {
	return this.privateStream.getNextIndex();
}

// ----
// Encode binary as they come (in base 64), but with only 2 possible values 0 and 1 and the 1 are sparse.
// Encoding only the distance between the beginning and the first 1 bit and then between two 1-bits. If series of 1, replace it by _? where ? is the length of the serie minus 3.
// No 0 encoded at start if a 1-bit is provided first.
StreamEncodingSparseBinary = function() {
	this.privateStream = new StreamEncodingString64();
	this.previous0s = 0;
	this.previous1s = 0;
	this.noDigitsYet = true;
}

StreamEncodingSparseBinary.prototype.encode = function(p_bit) {
	if (!p_bit) {
		if (this.previous1s > 0) {
			this.encodeSerieOf1();
			this.previous1s = 0;
		}
		this.previous0s++;
	} else {
		if (this.previous0s > 0) {
			this.privateStream.encode(this.previous0s);
			this.previous0s = 0;
		} else if (this.noDigitsYet) {
			this.privateStream.encode(0);
		}
		this.previous1s++;
	}
	this.noDigitsYet = false;
}

StreamEncodingSparseBinary.prototype.encodeSerieOf1 = function() {
	if (this.previous1s >= 3) {
		this.privateStream.addString("_");
		this.privateStream.encode(this.previous1s - 3);
	} else if (this.previous1s == 2) {
		this.privateStream.encode(0);
	}		
}

StreamEncodingSparseBinary.prototype.getString = function() {
	this.encodeSerieOf1();
	const answer = this.privateStream.getString();
	this.privateStream.string = "";
	this.previous0s = 0;
	this.previous1s = 0;
	this.noDigitsYet = true;
	return answer; 
}

/* Test :
encoder = new StreamEncodingSparseBinary(); 
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(1);encoder.encode(0);encoder.encode(1);
encoder.encode(1);encoder.encode(1); //0_481_0
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);
encoder.encode(0); // [13]
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(1);
encoder.encode(1);encoder.encode(1); // _[11
encoder.getString();

encoder.encode(1);encoder.encode(0);encoder.encode(1);encoder.encode(0);encoder.encode(1);
encoder.encode(1);encoder.encode(0);encoder.encode(1);encoder.encode(0);encoder.encode(1);
encoder.encode(1);encoder.encode(0);encoder.encode(1);encoder.encode(0);encoder.encode(1);
encoder.encode(1);encoder.encode(0);encoder.encode(1);encoder.encode(0);encoder.encode(1); //011011011011
encoder.getString();

encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(1);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(1);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(1);
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(1); //4444
encoder.getString();

encoder.encode(1);encoder.encode(1);encoder.encode(1);encoder.encode(0);encoder.encode(1); encoder.getString(); // 0_01
encoder.encode(1);encoder.encode(1);encoder.encode(0);encoder.encode(0);encoder.encode(1); encoder.getString(); // 002

encoder.encode(0);encoder.encode(1);encoder.encode(1);encoder.encode(1); encoder.getString(); // 1_0
encoder.encode(0);encoder.encode(0);encoder.encode(1);encoder.encode(1); encoder.getString(); //20
encoder.encode(0);encoder.encode(0);encoder.encode(0);encoder.encode(1);encoder.encode(1);encoder.encode(1); encoder.getString(); //3_0 
for(var i = 0; i < 5 ; i++) {encoder.encode(0);} encoder.getString(); // Chaîne vide
for(var i = 0; i < 64 ; i++) {encoder.encode(0);} encoder.getString(); // Chaîne vide
for(var i = 0; i < 64 ; i++) {encoder.encode(0);} 
encoder.encode(1); encoder.getString(); // [10]
for(var i = 0; i < 64 ; i++) {encoder.encode(0);} 
encoder.encode(1);
encoder.encode(1); encoder.getString(); // [10]0
for(var i = 0; i < 64 ; i++) {encoder.encode(0);} 
encoder.encode(1); 
for(var i = 0; i < 64 ; i++) {encoder.encode(0);} encoder.getString();  // [10]
for(var i = 0; i < 64 ; i++) {encoder.encode(0);} 
for(var i = 0; i < 64 ; i++) {encoder.encode(1);} encoder.getString(); // [10]_z
for(var i = 0; i < 64 ; i++) {encoder.encode(0);} 
for(var i = 0; i < 67 ; i++) {encoder.encode(1);} encoder.getString(); // [10]_[10]
for(var i = 0; i < 63 ; i++) {encoder.encode(0);} 
for(var i = 0; i < 66 ; i++) {encoder.encode(1);}
for(var i = 0; i < 62 ; i++) {encoder.encode(0);} 
for(var i = 0; i < 65 ; i++) {encoder.encode(1);}
for(var i = 0; i < 61 ; i++) {encoder.encode(0);} 
for(var i = 0; i < 64 ; i++) {encoder.encode(1);} encoder.getString(); // $_$@_@z_z



*/

StreamDecodingSparseBinary = function(p_string) {
	this.privateStream = new StreamDecodingString64(p_string);
	this.future1s = 0;
	this.future0s = 0;
	this.noDecodedYet = true;
	this.finalOne = false; // Useful when we have no character to see left but still an expected '1'
}

StreamDecodingSparseBinary.prototype.decode = function(p_string) {
	if (this.noDecodedYet) {
		this.noDecodedYet = false;
		const decode1stChar = this.privateStream.decodeWithPrefix();
		if (decode1stChar == END_OF_DECODING_STREAM) {
			return END_OF_DECODING_STREAM;
		} else {
			if (decode1stChar.prefix == "" && decode1stChar.value == 0) { // We must decode the next char to have a set of 0s or 1s
				const decode2ndChar = this.privateStream.decodeWithPrefix();
				if (decode2ndChar != END_OF_DECODING_STREAM) {
					if (decode2ndChar.prefix == "_") {
						this.future1s = decode2ndChar.value + 1; // See below
						this.oneFi = false;
					} else {
						this.future0s = decode2ndChar.value;
						this.finalOne = true;
					}
				}
				return true;
			} else {
				this.future0s = decode1stChar.value-1; // We consume one 0-bit right here
				return false;
			}
		}
	} else {
		if (this.future1s > 0) {
			this.future1s--;
			return true;
		} else if (this.future0s > 0) {
			this.future0s--;
			return false;
		} else {
			const decode = this.privateStream.decodeWithPrefix();
			if (decode == END_OF_DECODING_STREAM) {
				if (this.finalOne) {
					this.finalOne = false;
					return true;
				} else {
					return END_OF_DECODING_STREAM;
				}
			} else {
				if (decode.prefix == "_") {
					this.future1s = decode.value + 1;  // One "1" is consumed here, hence not +3. BUT one "1" will be consumed when retrieving the next character (or the first end of stream) hence not +2 either. Hence +1.
					this.finalOne = true;
				} else {
					this.finalOne = true;
					this.future0s = decode.value;
				}
				return true;
			}
		}
	}
}

//TODO : remove "getNextIndex" as it turned out to be useless ?

// Test 
/*
myString = "010101" // => 101101101
decoder = new StreamDecodingSparseBinary(myString);
for (var i = 0; i <= 9; i++) { console.log(decoder.decode())};
console.log("Done");

myString = "0010102" // => 11011011001
decoder = new StreamDecodingSparseBinary(myString);
for (var i = 0; i <= 11; i++) { console.log(decoder.decode())};
console.log("Done");


myString = "0_23_3[10][10]_[10]a" // => 11111000111111(64 0s)1(64 0s)(67 1s)(36 0s)1, total length 246
decoder = new StreamDecodingSparseBinary(myString);
for (var i = 0; i <= 255; i++) { console.log(decoder.decode())};
console.log("Done");

myString = "21_2" // => 001011111
decoder = new StreamDecodingSparseBinary(myString);
for (var i = 0; i <= 9; i++) { console.log(decoder.decode())};
console.log("Done");

myString = "" // 
decoder = new StreamDecodingSparseBinary(myString);
for (var i = 0; i <= 3; i++) { console.log(decoder.decode())};
console.log("Done");
*/

/*myString = "a_ab_bc_cd" // => (36 0s, 39 1s, 37 0s, 40 1s, 38 0s, 41 1s, 39 0s, 1, total length 271
decoder = new StreamDecodingSparseBinary(myString);
for (var i = 0; i <= 271; i++) { console.log(decoder.decode())};
console.log("Done");*/

// TODO well, not perfect but if mistakes happen I'll realize it before I've saved and loaded strings into local storage, riiight ?