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
    
    path_image = 'https://media.githubusercontent.com/media/IDEMSInternational/parenting-app-ui/master/src/assets/plh_assets/'
    
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
            requests = [
                {
                    'insertText': {
                        'location': {
                            'index': 1,
                        },
                        'text': path_image + text if first else "\n"+path_image + text
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
        requests.append(insert_text(text = key, style = 'HEADING_' + str(level)))
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
        title = doc_file_names[fl]
        
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
    
   
        requests = []
        
        for i in data:
            make_requests(i, data[i], level = 1, requests = requests)
        
        requests.reverse()
        
        result = doc_service.documents().batchUpdate(
            documentId=DOCUMENT_ID, body={'requests': requests}).execute()
        print('Sent requests to document: {0}'.format(len(requests)))

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
