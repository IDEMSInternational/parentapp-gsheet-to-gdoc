var fs = require('fs');
var path = require("path");

var input_path = path.join(__dirname, "../files/input_jsons/all-templates.json");
var json_string = fs.readFileSync(input_path).toString();
var sheet_obj = JSON.parse(json_string);



var workshop_names = ["1on1","instruct",];

workshop_names.forEach(workshop_name =>{

let include_sheets = [];

var curr_stepper_sheet = sheet_obj.filter(sheet =>(sheet.flow_name == "w_" + workshop_name + "_stepper"));
if (curr_stepper_sheet.length ==0){
    error("no stepper sheet for " + workshop_name)
}else{
    curr_stepper_sheet = curr_stepper_sheet[0];
}
var stepper_rows = curr_stepper_sheet.rows.filter(row => row.value == "workshop_stepper");
stepper_rows.forEach(s_row =>{
    let nav_row = s_row.rows.filter(row => (row.name == "nav_template_list"));
    if (nav_row.length != 1){
        error("no nav template list for " + workshop_name)
    }else{
        nav_row = nav_row[0];
    }
    include_sheets.push("w_" + workshop_name +"_stepper");
    let nav_list = nav_row.value.split(";");
    nav_list.forEach(w_name => {
        let tidy_name = w_name.substring(w_name.indexOf('w_'+ workshop_name + "_"));
        include_sheets.push(tidy_name);    
    }); 
    include_sheets.push("w_" + workshop_name +"_tools");
});



var doc_obj = {};
var sheet_obj_subset = sheet_obj.filter(sheet => (include_sheets.includes(sheet.flow_name)))
sheet_obj_subset.forEach(sheet => {
    var sheet_content = sheet.rows;
    var new_obj = {};
    create_nested_json(sheet_content,new_obj,{},"",1);
    doc_obj[sheet.flow_name] = new_obj;
    
});


console.log(include_sheets)


// write output
doc_obj = JSON.stringify(doc_obj, null, 2);
var output_path = path.join(__dirname, "../files/jsons_for_docs/" + workshop_name + "_file_for_doc.json");
fs.writeFile(output_path, doc_obj, function (err, result) {
    if (err) console.log('error', err);
});

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