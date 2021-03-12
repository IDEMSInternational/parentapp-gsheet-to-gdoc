var fs = require('fs');
var path = require("path");

var input_path = path.join(__dirname, "../files/input/template_app.json");
var json_string = fs.readFileSync(input_path).toString();
var sheet_obj = JSON.parse(json_string);

var doc_obj = {};

sheet_obj.forEach(sheet => {
    var sheet_content = sheet.rows;
    var new_obj = {};
    create_nested_json(sheet_content,new_obj,{},"",1);
    doc_obj[sheet.flow_name] = new_obj;
    
});





// write output
doc_obj = JSON.stringify(doc_obj, null, 2);
var output_path = path.join(__dirname, "../files/jsons_for_docs/file_for_doc.json");
fs.writeFile(output_path, doc_obj, function (err, result) {
    if (err) console.log('error', err);
});



//////////////////////////////////////////////////////////////////////////
function create_nested_json(curr_row_list,curr_dict,prev_dict,prev_key,lev){
    for (var r=0; r<curr_row_list.length; r++){
        var row = curr_row_list[r];
        if (row.hasOwnProperty('rows') && row.rows.length >0){
           curr_dict[row.name] = {};
           create_nested_json(row.rows,curr_dict[row.name], curr_dict,row.name,lev+1)
        } else{
          curr_dict[row.name] = row.value;
        }
        

    }


}