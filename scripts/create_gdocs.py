from __future__ import print_function
import pickle
import os.path
import json
from os import listdir
from os.path import isfile, join
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import time

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents']

def main():
    """Shows basic usage of the Docs API.
    Prints the title of a sample document.
    """
    creds = None
    # The file token.pickle stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    
    drive_service = build('drive', 'v3', credentials=creds)
    doc_service = build('docs', 'v1', credentials=creds)
    spreadsheet_service = build('sheets', 'v4', credentials=creds)

    folders_IDs = {}
    files_IDs = {}
    files_urls = {}
    
    path_image = 'https://github.com/IDEMSInternational/parenting-app-ui/blob/master/src/assets/plh_assets/' #'https://media.githubusercontent.com/media/IDEMSInternational/parenting-app-ui/master/src/assets/plh_assets/'
    
    # create external folder
    file_metadata = {
        'name': 'ParentApp docs',
        'mimeType': 'application/vnd.google-apps.folder'
    }
    folder_file = drive_service.files().create(body=file_metadata,
                                        fields='id').execute()
    parent_id = folder_file.get('id')
    parentapp_folder_id = parent_id

    # get names of the JSON files for docs
    
    doc_file_names = [f for f in listdir('../files/jsons_for_docs') if isfile(join('../files/jsons_for_docs/', f))]
   
    
    # functions to create google docs
    def insert_text(text, style, first = False):
        if text.endswith(".svg"):
            svg_url = path_image + text
            requests = [         
                {
                    'insertText': {
                        'location': {
                            'index': 1,
                        },
                        'text': svg_url if first else "\n"+ svg_url
                    }
                },
                {"updateTextStyle":{
                        "textStyle": {
                            "link": {"url": svg_url}
                        },
                        "fields": "link",
                        "range": {
                            "startIndex": 1,
                            "endIndex": len(svg_url)+2,
                        }
                    }

                }
            ]
        else:
            requests = [
                {
                    'insertText': {
                        'location': {
                            'index': 1,
                        },
                        'text': text if first else "\n"+text
                    }
                }
            ]
            
        
        if style:
            requests.append(
                {
                    'updateParagraphStyle': {
                        'range': {
                            'startIndex': 1 if first else 2,
                            'endIndex':  len(text)
                        },
                        'paragraphStyle': {
                            'namedStyleType': style,
                        },
                        'fields': 'namedStyleType'
                    }
                }
            )
        return requests


    def make_requests(key, value, level, requests):
        lev_for_heading = min(level,6)
        if level == 1:
            flow_name_words = key.replace("w_" + title + "_","").split("_")
            heading_text = ""

            for name in flow_name_words:
                heading_text = heading_text + name.capitalize() + " "
            
            slice_obj = slice(0, -1)
            heading_text = heading_text[slice_obj]
            if heading_text == "Stepper":
                heading_text = "Workshop: " + title.capitalize()
    
            
            heading_1_dict[heading_text] = {}
            heading_1_dict[heading_text]["key"] = key

            
        elif lev_for_heading == level:
            heading_text = key
        else:
            heading_text = '###section_' + str(level) + ' ' + key

        requests.append(insert_text(text = heading_text, style = 'HEADING_' + str(lev_for_heading)))
        if isinstance(value, str):
            req = insert_text(text = value, style = '')
            requests.append(req)
        elif isinstance(value, dict):
            for i in value:
                make_requests(i, value[i], level = level + 1, requests = requests)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    for i in item:
                        make_requests(i, item[i], level = level + 1, requests = requests)
                elif isinstance(item, str):
                    req = insert_text(text = item, style = '')
                    requests.append(req)

        requests
    
    # create google docs #############################################
    
    for fl in range(len(doc_file_names)):
        time.sleep(6)
        # initialise the doc
        title = doc_file_names[fl].replace("_file_for_doc.json","")
        
        body = {
            "title": title,
        }
        
        doc = doc_service.documents().create(body=body).execute()
        print('Created document with title: {0}'.format(doc.get('title')))
        DOCUMENT_ID = doc.get('documentId')

        files_IDs[title] = DOCUMENT_ID
        files_urls[title] = "https://docs.google.com/document/d/" + DOCUMENT_ID + "/edit"
    
        # load json file 
        with open('../files/jsons_for_docs/' + doc_file_names[fl], encoding="utf8") as json_file:
            data = json.load(json_file)
    
        heading_1_dict = {}
        requests = []
        
        for i in data:
            make_requests(i, data[i], level = 1, requests = requests)
        
        requests.reverse()
        
        result = doc_service.documents().batchUpdate(
            documentId=DOCUMENT_ID, body={'requests': requests}).execute()
        print('Sent requests to document: {0}'.format(len(requests)))

        # add hyperlinks to headings 1
        hyper_requests = []
        doc = doc_service.documents().get(documentId=DOCUMENT_ID).execute()
        doc_content = doc.get('body').get('content')[2:]
        for par in doc_content:
            if par.get("paragraph").get("paragraphStyle").get("namedStyleType") == "HEADING_1":
                head_name = par.get("paragraph").get("elements")[0].get("textRun").get("content").strip("\n")
                heading_1_dict[head_name]["head_id"] = par.get("paragraph").get("paragraphStyle").get("headingId")

      
        for head,head_info in heading_1_dict.items():
            for par in doc_content:
                if (par.get("paragraph").get("paragraphStyle").get("namedStyleType") == "NORMAL_TEXT" and par.get("paragraph").get("elements")[0].get("textRun").get("content").startswith(head_info.get("key"))):
                    start_index = par.get('startIndex')
                    end_index = par.get('endIndex')
                    hyper_requests.append(
                        {"updateTextStyle":{
                                "textStyle": {
                                    "link": {"headingId":head_info.get("head_id") }
                                },
                                "fields": "link",
                                "range": {
                                    "startIndex": start_index,
                                    "endIndex": end_index,
                                }
                            }

                        }
                    )

        if len(hyper_requests)>0:
            new_result = doc_service.documents().batchUpdate(
                documentId=DOCUMENT_ID, body={'requests': hyper_requests}).execute()
            print('Sent requests to document: {0}'.format(len(hyper_requests)))



        # move document to correct folder
        folder_id = parentapp_folder_id
        # Retrieve the existing parents to remove
        file = drive_service.files().get(fileId=DOCUMENT_ID,
                                       fields='parents').execute()
        previous_parents = ",".join(file.get('parents'))
        # Move the file to the new folder
        file = drive_service.files().update(fileId=DOCUMENT_ID,
                                            addParents=folder_id,
                                           removeParents=previous_parents,
                                           fields='id, parents').execute()




    #create files with files IDS and urls
    with open('../files/output/files_IDs.json', 'w') as outfile:
        json.dump(files_IDs, outfile)

    with open('../files/output/files_urls.json', 'w') as outfile:
        json.dump(files_urls, outfile)



if __name__ == '__main__':
    main()
