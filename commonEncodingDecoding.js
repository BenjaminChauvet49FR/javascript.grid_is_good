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

function StreamDecodingString64(p_string) {
	this.string = p_string;
	this.index = 0;
}

StreamDecodingString64.prototype.decode = function () {
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
		return {prefix : preNumber, value : value};	
	}
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

StreamBinaryBlock7Encoder.prototype.encodeBit = function(p_bit) {
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

StreamEncodingFullBase.prototype.encodeDigit = function(p_digit) {
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
	this.indexInString = 0;
	this.arrayDigits = [];
	if (this.privateString.length != 0) {
		this.arrayDigits = arrayDigitsBase(decode64FromCharacter(this.privateString.charAt(0)), this.base, this.capDigits);
	}
	this.indexInArrayDigits = 0;
}

StreamDecodingFullBase.prototype.getValue = function() {
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
	return this.privateStream.string;
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
			const val = this.privateStream.decode();
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


// ----
// Encode binary as they come (in base 64), but with only 2 possible values 0 and 1 and the 1 are sparse.
// If one value is true : "-"
// If two bits are true : "--" 
// Three bits or more in a row : "_?" where ? is the number of bits at 1 (0 if exactly 3 bits were at 1)
// Also, distance with the previous (or the beginning) if series of 0.
// No 0 encoded at start if a 1-bit is provided first.
StreamEncodingSparseBinary = function() {
	this.privateStream = new StreamEncodingString64();
	this.currentSameBits = 0;
	this.lastBit1 = false;
}

StreamEncodingSparseBinary.prototype.encode = function(p_bit) {
	if (!p_bit) {
		if (this.lastBit1) { // From 1 to 0 : copy all 1s met as a "-", "--" or "_?" (see below)
			this.encodeSerieOf1();			
		}
	} else {
		if (!this.lastBit1 && this.currentSameBits != 0) { // From 0 to 1 : copy all 0s met... as a value. Do not encode 0 if the string starts with 0.
			this.privateStream.encode(this.currentSameBits);					
			this.currentSameBits = 0;			
		}
	}
	this.currentSameBits++;
	this.lastBit1 = p_bit;
}

StreamEncodingSparseBinary.prototype.encodeSerieOf1 = function() {
	if (this.currentSameBits >= 3) {
		this.privateStream.addString("_");
		this.privateStream.encode(this.currentSameBits-3);				
	} else if (this.currentSameBits == 2) {
		this.privateStream.addString("--");
	} else {
		this.privateStream.addString("-");
	}
	this.currentSameBits = 0;
}

StreamEncodingSparseBinary.prototype.getString = function() {
	if (this.lastBit1) {
		this.encodeSerieOf1();
	}
	const answer = this.privateStream.string;
	this.privateStream.string = "";
	this.currentSameBits = 0;
	this.lastBit1 = false; // C/P from initialization 
	return answer; 
}

/* Test :
encoder = new StreamEncodingSparseBinary(); 
encoder.encode(1); encoder.encode(1); encoder.encode(1); encoder.encode(1); encoder.encode(1); 
encoder.encode(1); encoder.encode(1); encoder.encode(0); encoder.encode(0); encoder.encode(0); 
encoder.encode(0); encoder.encode(0); encoder.encode(0); encoder.encode(0); encoder.encode(0); // _48
encoder.encode(1); encoder.encode(0); encoder.encode(1); encoder.encode(1); encoder.encode(1); // -1_0 
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
*/

StreamDecodingSparseBinary = function(p_string) {
	this.privateStream = new StreamDecodingString64(p_string);
	this.future1s = 0;
	this.future0s = 0;
}

StreamDecodingSparseBinary.prototype.decode = function(p_string) {
	if (this.future1s > 0) {
		this.future1s--;
		return true;
	} else {
		if (this.future0s == 0) {
			const val = this.privateStream.decode();
			if (val != END_OF_DECODING_STREAM) {
				switch(val.prefix) {
					case "" : 
						this.future0s = val.value; 
					break;
					case "--" : 
						this.future1s = 2; 
						this.future0s = val.value; 
					break;
					case "-" : 
						this.future1s = 1; 
						this.future0s = val.value;
					break;
					case "_" : 
						this.future1s = val.value + 3; 
						this.future0s = 0;
					break;
				}		
			} else {
				return END_OF_DECODING_STREAM;
			}				
		}
		if (this.future1s > 0) {
			this.future1s--;
			return true;
		}
		this.future0s--
		return false;	
	}
}
// Test 
/*
decoder = new StreamDecodingSparseBinary("3-4-1_21_[10]"); // 3 + 1 + 4 + 1 + 1 + 5 + 1 + 67 = 83
for(var i = 0; i < 83 ; i++) {
	console.log(decoder.decode())
} 
console.log("Done");*/


// TODO well, not perfect but if mistakes happen I'll realize it before I've saved and loaded strings into local storage, riiight ?