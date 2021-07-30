console.log("### Process start");
var fs = require('fs');
var path = require("path");
console.log("### Requirements for input set");

var input_path = path.join(__dirname, "../files/input_jsons/test-templates.json");
console.log("### Define input path to " + input_path);

var json_string = fs.readFileSync(input_path).toString();
console.log("### JSON string generated from input file");

//json_string = json_string.replace(/^(\s*)([a-zA-Z0-9_@.-]+)(:)/gm, '$1"$2": ');

//json_string = json_string.replace(/(,)(\r?\n\s*[}\]])/g, '$2');

console.log("### Output:");
//console.log(json_string);

/*
function JSONify(obj) {
    if (typeof obj === 'object') {
        var o = {};
        for (var i in obj) {
            o['"' + i + '"'] = JSONify(obj[i]); // make the quotes
        }
        return o;
    } else {
        return obj;
    }
}

*/


//var sheet_obj = JSON.parse(json_string);
//console.log("### JSON string has been successfully parsed");




