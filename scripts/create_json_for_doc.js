console.log("start");
var fs = require('fs');
var path = require("path");
console.log("a");
var input_path = path.join(__dirname, "../files/input_jsons/all-templates.json");
console.log("b");
var json_string = fs.readFileSync(input_path).toString();
console.log("c");

var sheet_obj = JSON.parse(json_string);
console.log("Here");
var input_path_names = path.join(__dirname, "../files/input_jsons/all-globals.json");
var json_string_names = fs.readFileSync(input_path_names).toString();
var names_obj = JSON.parse(json_string_names);
console.log("Even Here");

var excluded_templates = ["workshop_activity",
    "welcome_together",
    "watch",
    "topic_intro",
    "listen",
    "essential_tool",
    "nav_buttons",
    "tools_activity",
    "relax",
    "suggestions",
    "think_temp",
    "home_practice",
    "care_together",
    "talk_together",
    "reflect_together",
    "read_temp",
    "read",
    "learn_temp",
    "welcome_individual",
    "question_time",
    "box_tools",
    "suggestions_ticks",
    "box_image",
    "survey_stepper",
    "box_slider_week_temp",
    "box_multi_3_temp",
    "box_slider_week_temp",
    "box_multi_4_temp",
    "box_slider_confidence_temp",
    "box_slider_week_temp",
    "reflect_individual",
    "workshop_stepper",
    "try_together",
    "box_slider_month_temp",
    "something_fun_text",
    "m_hp_reminder",
    "in_week_message",
    "m_workshop_tomorrow",
    "m_workshop_released",
    "home_practice_review",
    "hp_review_tips_feedback",
    "hp_review_other_challenge",
    "m_something_fun",
    "m_praise",
    "m_workshop_reminder",
    "m_workshop_in_progress",
    "box_parent_point_counter",
    "home_practice_challenges",
    "ending",
    "tool_tile"];
//var excluded_templates = [];
var added_templates_obj = {};

var template_names_to_process = [];
var titles_obj = names_obj.filter(fl => (fl.flow_name == "workshop_titles"))[0];

titles_obj.rows.forEach(title => {
    if (!title.name.endsWith("short")) {
        template_names_to_process.push(title.name)
    }
})

template_names_to_process.push("survey_welcome");

template_names_to_process.push("workshop_setup");

template_names_to_process.push("message_navigation");



template_names_to_process.push("w_1on1_hp_highlights");
template_names_to_process.push("w_1on1_hp_challenges");
template_names_to_process.push("w_1on1_hp_review");

template_names_to_process.push("w_instruct_hp_review");
template_names_to_process.push("w_instruct_hp_highlights");
template_names_to_process.push("w_instruct_hp_challenges");

template_names_to_process.push("w_praise_hp_review");
template_names_to_process.push("w_praise_hp_content");

template_names_to_process.push("w_stress_hp_review");
template_names_to_process.push("w_stress_hp_challenges");

template_names_to_process.push("w_money_hp_review");
template_names_to_process.push("w_money_hp_challenges");

template_names_to_process.push("w_rules_hp_review");
template_names_to_process.push("w_rules_hp_challenges");

template_names_to_process.push("w_consequence_hp_review");
template_names_to_process.push("w_consequence_hp_challenges");

template_names_to_process.push("w_solve_hp_review");
template_names_to_process.push("w_solve_hp_challenges");

template_names_to_process.push("w_safe_hp_review");
template_names_to_process.push("w_safe_hp_challenges");

template_names_to_process.push("w_crisis_hp_review");
template_names_to_process.push("w_crisis_hp_challenges");

template_names_to_process.push("");

template_names_to_process.push("parent_centre");

template_names_to_process.forEach(template_name => {
    added_templates = [];
    console.log(template_name)

    let include_sheets = [];
    var curr_stepper_sheet = sheet_obj.filter(sheet => (sheet.flow_name == template_name + "_stepper"));
    if (curr_stepper_sheet.length == 0) {
        include_sheets.push(template_name);
        //        console.log("no stepper sheet for " + template_name)
    } else {
        curr_stepper_sheet = curr_stepper_sheet[0];
        var workshop_stepper_rows = curr_stepper_sheet.rows.filter(row => row.value == "workshop_stepper");
        var survey_stepper_rows = curr_stepper_sheet.rows.filter(row => row.value == "survey_stepper");
        if (workshop_stepper_rows.length > survey_stepper_rows.length) {
            var stepper_rows = workshop_stepper_rows
        } else {
            var stepper_rows = survey_stepper_rows
        };
        if (stepper_rows.length != 1) {
            console.log("multiple stepper rows for " + template_name)
        } else {
            s_row = stepper_rows[0];
            let nav_rows = s_row.rows.filter(row => (row.name == "nav_template_list"));
            if (nav_rows.length == 0) {
                console.log("no nav template list for " + template_name)
            } else {
                nav_rows.forEach(nav_row => {
                    var local_include_sheets = [];
                    if (nav_row.hasOwnProperty("value")) {
                        include_sheets.push(template_name + "_stepper");
                        local_include_sheets.push(template_name + "_stepper");

                        let nav_list = nav_row.value;
                        nav_list.forEach(w_name => {
                            include_sheets.push(w_name);
                            local_include_sheets.push(w_name);
                        });
                        include_sheets.push(template_name + "_tools");
                        local_include_sheets.push(template_name + "_tools");
                        //replace navigation list
                        nav_row.value = "";
                        local_include_sheets.forEach(ws => {
                            nav_row.value = nav_row.value + ws + ";\n"
                        });
                        nav_row.value = nav_row.value.substring(0, nav_row.value.length - 2);

                    }
                });
            }
        }
    }




    var doc_obj = {};
    var sheet_obj_subset = sheet_obj.filter(sheet => (include_sheets.includes(sheet.flow_name)))
    sheet_obj_subset.forEach(sheet => {
        var sheet_content = sheet.rows;
        var new_obj = {};
        create_nested_json(sheet_content, new_obj, 1);
        doc_obj[sheet.flow_name] = new_obj;

    });

    added_templates_obj[get_display_name(template_name)] = added_templates;
    // write output
    if (Object.keys(doc_obj).length > 0) {
        doc_obj = JSON.stringify(doc_obj, null, 2);
        var output_path = path.join(__dirname, "../files/jsons_for_docs/" + get_display_name(template_name) + "_file_for_doc.json");
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

function get_display_name(template_name) {
    // David believes the correct syntax here is \bw_* but it didn't seem to work when tested
    if (template_name.match("w_")) {
        console.log("template name is " + template_name);
        console.log("display name is " + template_name.substring(2));
        return template_name.substring(2)
    } else {
        console.log("template name is " + template_name);
        return template_name
    }
};


//////////////////////////////////////////////////////////////////////////
function create_nested_json(curr_row_list, curr_dict) {
    var curr_repeated_keys = {};
    for (var r = 0; r < curr_row_list.length; r++) {
        var row = curr_row_list[r];

        if (curr_repeated_keys.hasOwnProperty(row.name)) {
            var new_key = row.name + " " + curr_repeated_keys[row.name];
            curr_repeated_keys[row.name]++;
        } else if (curr_dict.hasOwnProperty(row.name)) {
            curr_repeated_keys[row.name] = 2;
            var new_key = row.name + " " + curr_repeated_keys[row.name];
            curr_repeated_keys[row.name]++;
        } else {
            var new_key = row.name;
        }


        if (row.hasOwnProperty('rows') && row.rows.length > 0) {
            curr_dict[new_key] = {};
            create_nested_json(row.rows, curr_dict[row.name])
        } else {
            if (row.hasOwnProperty('value')) {
                curr_dict[new_key] = row.value;
            } else {
                curr_dict[new_key] = "";
            }

        }

        if (row.type == "template") {
            var template_sheet = sheet_obj.filter(sheet => (sheet.flow_name == row.value))
            if (template_sheet.length != 1) {
                console.log("no template found for " + row.value + " in " + row.name)
            } else if (!excluded_templates.includes(row.value)) {
                added_templates.push(row.value)
                /* if (!added_templates.includes(row.value)){
                     added_templates.push(row.value)
                 }*/
                curr_dict["template: " + row.value] = {};
                create_nested_json(template_sheet[0].rows, curr_dict["template: " + row.value]);
            }

        } else if (row.hasOwnProperty("action_list")) {
            row.action_list.forEach(action => {
                if (action.hasOwnProperty("action_id") && (action.action_id == "pop_up" || action.action_id == "go_to")) {
                    action.args.forEach(template => {
                        var template_sheet = sheet_obj.filter(sheet => (sheet.flow_name == template))
                        if (template_sheet.length != 1) {
                            console.log("no template " + template + "found for " + row.name)
                        } else {
                            curr_dict[action.action_id + ": " + template] = {};
                            create_nested_json(template_sheet[0].rows, curr_dict[action.action_id + ": " + template]);
                        }
                    })
                }
            })
        }



    }


}
