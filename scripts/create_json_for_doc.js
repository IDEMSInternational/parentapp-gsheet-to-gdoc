var fs = require('fs');
var path = require("path");

var input_path = path.join(__dirname, "../files/input_jsons/all-templates.json");
var json_string = fs.readFileSync(input_path).toString();
var sheet_obj = JSON.parse(json_string);

var input_path_names = path.join(__dirname, "../files/input_jsons/all-globals.json");
var json_string_names = fs.readFileSync(input_path_names).toString();
var names_obj = JSON.parse(json_string_names);


var excluded_templates = [];
var added_templates_obj = {};

var workshop_names = [];
var titles_obj = names_obj.filter(fl =>(fl.flow_name == "workshop_titles"))[0];

titles_obj.rows.forEach(title =>{
    if (!title.name.endsWith("short") ){
        workshop_names.push(title.name)
    }

})


workshop_names.forEach(workshop_name =>{
    added_templates = [];
    console.log(workshop_name)

    let include_sheets = [];
    var curr_stepper_sheet = sheet_obj.filter(sheet =>(sheet.flow_name == workshop_name + "_stepper"));
    if (curr_stepper_sheet.length ==0){
        console.log("no stepper sheet for " + workshop_name)
    }else{
        curr_stepper_sheet = curr_stepper_sheet[0];
        var stepper_rows = curr_stepper_sheet.rows.filter(row => row.value == "workshop_stepper");
        
        stepper_rows.forEach(s_row =>{
            var local_include_sheets = []
            let nav_row = s_row.rows.filter(row => (row.name == "nav_template_list"));
            
            if (nav_row.length != 1){
                console.log("no nav template list for " + workshop_name)
            }else{
                nav_row = nav_row[0];
                
                if (nav_row.hasOwnProperty("value")){
                    include_sheets.push(workshop_name +"_stepper");
                    local_include_sheets.push(workshop_name +"_stepper");
                    
                    /*
                    let nav_list = nav_row.value.split(";");
                    nav_list.forEach(w_name => {
                        let tidy_name = w_name.substring(w_name.indexOf( workshop_name + "_"));
                        include_sheets.push(tidy_name); 
                        local_include_sheets.push(tidy_name);    
                    }); 
                    */
                    let nav_list = nav_row.value;
                    nav_list.forEach(w_name => {
                        include_sheets.push(w_name); 
                        local_include_sheets.push(w_name);    
                    }); 


                    include_sheets.push(workshop_name +"_tools");
                    local_include_sheets.push(workshop_name +"_tools");
                    //replace navigation list
                    nav_row.value ="";
                    local_include_sheets.forEach(ws =>{
                        nav_row.value = nav_row.value + ws + ";\n"
                    });
                    nav_row.value = nav_row.value.substring(0,nav_row.value.length -2);


                }else{
                    console.log("no value in nav template list for " + workshop_name)
                }
            }

        });
    }
    var doc_obj = {};
    var sheet_obj_subset = sheet_obj.filter(sheet => (include_sheets.includes(sheet.flow_name)))
    sheet_obj_subset.forEach(sheet => {
        var sheet_content = sheet.rows;
        var new_obj = {};
        create_nested_json(sheet_content,new_obj,1);
        doc_obj[sheet.flow_name] = new_obj;
    
    });

    added_templates_obj[workshop_name.substring(2)] = added_templates;
    // write output
    if (Object.keys(doc_obj).length >0){
        doc_obj = JSON.stringify(doc_obj, null, 2);
        var output_path = path.join(__dirname, "../files/jsons_for_docs/" + workshop_name.substring(2) + "_file_for_doc.json");
        fs.writeFile(output_path, doc_obj, function (err, result) {
            if (err) console.log('error', err);
        });
    }
    



});

added_obj = JSON.stringify(added_templates_obj, null, 2);
var output_path = path.join(__dirname, "../files/added_templates.json");
fs.writeFile(output_path, added_obj, function (err, result) {
    if (err) console.log('error', err);
});



//////////////////////////////////////////////////////////////////////////
function create_nested_json(curr_row_list,curr_dict){
    var curr_repeated_keys = {};
    for (var r=0; r<curr_row_list.length; r++){
        var row = curr_row_list[r];

        if (curr_repeated_keys.hasOwnProperty(row.name)){
            var new_key = row.name + " " + curr_repeated_keys[row.name];
            curr_repeated_keys[row.name]++;
        }else if (curr_dict.hasOwnProperty(row.name)){
            curr_repeated_keys[row.name] = 2;
            var new_key = row.name + " " + curr_repeated_keys[row.name];
            curr_repeated_keys[row.name]++;
        } else {
            var new_key = row.name;
        }

       
        if (row.hasOwnProperty('rows') && row.rows.length >0){
           curr_dict[new_key] = {};
           create_nested_json(row.rows,curr_dict[row.name])
        } else{
            if (row.hasOwnProperty('value')){
                curr_dict[new_key] = row.value;
            }else{
                curr_dict[new_key] = "";
            }
          
        }
        
        if (row.type == "template"){
            var template_sheet = sheet_obj.filter(sheet =>(sheet.flow_name == row.name))
            if (template_sheet.length != 1){
                console.log("no template found for " + row.name)
            }else if (!excluded_templates.includes(row.name)){
                added_templates.push(row.name)
               /* if (!added_templates.includes(row.name)){
                    added_templates.push(row.name)
                }*/
                curr_dict["template: " + row.name] = {};
                create_nested_json(template_sheet[0].rows,curr_dict["template: " + row.name]);
            }
            
        }else if (row.hasOwnProperty("action_list")){
            row.action_list.forEach(action =>{
                if (action.hasOwnProperty("action_id") && (action.action_id == "pop_up" || action.action_id == "go_to") ){
                    action.args.forEach( template =>{
                        var template_sheet = sheet_obj.filter(sheet =>(sheet.flow_name == template))
                        if (template_sheet.length != 1){
                            console.log("no template found for " + row.name)
                        }else{
                            curr_dict[ action.action_id + ": " + template] = {};
                            create_nested_json(template_sheet[0].rows,curr_dict[action.action_id + ": " + template]);
                        }
                    })
                }
            })
        }
        
             

    }


}
