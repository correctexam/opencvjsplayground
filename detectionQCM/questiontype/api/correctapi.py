import json
import os
import aiofiles
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from grip import export
from pydantic import BaseModel
import paths

# run : uvicorn correctapi:questionapp --reload

questionapp = FastAPI()


@questionapp.get('/status/exam/{examid}')
async def statusexam(examid : int):
    return {'examId':examid,'exists':examid in loadExamInfos()}

@questionapp.get('/status/exam/{examid}/question/{questnum}')
async def statusquestion(examid : int,questnum : int):
    examinfos = loadExamInfos()
    if(str(examid) not in examinfos):
        return {'status':'error','reason':'exam_unknown'}
    return {'status':'success','examId':examid,'questnum':questnum,'exists':questnum in examinfos[str(examid)]['question-numbers']}

@questionapp.get('/')
async def root():
    return {'message':'connected to CorrectAPI'}


# SAVING MANAGEMENT PART

def loadExamInfos()->dict:
    with open(paths.EXAMINFOS) as json_file:
        examinfos = json.load(json_file)
        return examinfos

def saveExamInfos(examinfos :dict):
    with open(paths.EXAMINFOS, 'w') as outfile:
        examstr = str(json.dumps(examinfos,indent=2))
        outfile.write(examstr)

        
# GESTION DES ERREURS CORS
origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:9000",
]
questionapp.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)