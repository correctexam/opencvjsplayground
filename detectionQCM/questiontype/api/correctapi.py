import json
import os
from sre_constants import SUCCESS
import aiofiles
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from grip import export
from pydantic import BaseModel
import paths

# run : uvicorn correctapi:questionapp --reload

questionapp = FastAPI()

@questionapp.get('/')
async def root():
    return {'message':'connected to CorrectAPI'}

#---------DATA STRUCTURES for client
class StudentRespName(BaseModel):
    studid:int
    source:str |list[str]

#---------ENDPOINTS TO GET INFORMATIONS ABOUT WHAT EXISTS IN THE BACKEND---------
@questionapp.get('/status/exam/{examid}')
async def status_exam(examid : int):
    return _statusExam(examid)

@questionapp.get('/status/exam/{examid}/question/{questnum}')
async def status_question(examid : int,questnum : int):
   return _statusQuestion(examid,questnum)

@questionapp.post('/status/exam/{examid}/question/{questnum}/student-answser/')
async def status_student_resp(examid : int, questnum:int, srn : StudentRespName):
    return _statusStudentResp(examid,questnum,srn)

#--Tools
def _statusExam(examid:int):
    examinfos = loadExamInfos()
    existence =  str(examid) in examinfos and 'question-details' in examinfos[str(examid)] 
    return {'examId':examid,'exists':existence}

def _statusQuestion(examid : int, questnum : int):
    examinfos = loadExamInfos()
    if(not _statusExam(examid)['exists']):
        return {'status':'error','reason':'exam_unknown'}
    else:
        questnums = examinfos[str(examid)]['question-details'].keys()
        return {'status':'success','examId':examid,'questnum':questnum,'exists':str(questnum) in questnums}

def _statusStudentResp(examid : int, questnum:int, srn : StudentRespName):
    sq = (_statusQuestion(examid,questnum))
    if(sq['status']!='success'):
        return sq
    elif not sq['exists']:
        return {'status':'error','reason':'quest_unknown'}
    else:
        examinfos = loadExamInfos()
        studsInfo = examinfos[str(examid)]['question-details'][str(questnum)]['students']
        srnExist = str(srn.studid) in studsInfo.keys() and studsInfo[str(srn.studid)]==srn.source
        return {'status':'success','examId':examid,'questnum':questnum,'student':srn.studid,'exists':srnExist}



#----------ENDPOINTS TO DECLARE NEW EXAMS METADATA OR QUESTIONS METADATA. IF THEY ALREADY EXIST, THE OLD DATA IS CRUSHED



#--EndPoints
@questionapp.post('/create/exam')
async def create_exam(examid : int):
    return _newExam(examid)

@questionapp.post('/create/question')
async def create_question(examid : int,numquest:int):
  return _newQuestion(examid,numquest)

@questionapp.post('/create/studrespname')
async def create_student_response_name(examid : int, numquest:int,srn : StudentRespName):
    return _newStudentSheetName(examid,numquest,srn)

#--Tools
def _newExam(examid:int):
    examinfos = loadExamInfos()
    examinfos[str(examid)] = {'question-details':{}}
    saveExamInfos(examinfos)
    return _statusExam(examid)

def _newQuestion(examid:int,numquest:int):
    exam_exists = _statusExam(examid)['exists']
    if(not exam_exists):
        _newExam(examid)
    examinfos = loadExamInfos()
    examinfos[str(examid)]['question-details'][str(numquest)]={"students":{}}
    saveExamInfos(examinfos)
    return _statusQuestion(examid,numquest)

def _newStudentSheetName(examid : int, numquest:int,srn : StudentRespName):
    sq = _statusQuestion(examid,numquest)
    if(sq['status']=='error' or not sq['exists']):
        _newQuestion(examid,numquest)
    examinfos = loadExamInfos()
    examinfos[str(examid)]['question-details'][str(numquest)]['students'][str(srn.studid)]=srn.source
    saveExamInfos(examinfos)
    return 



#----------ENDPOINTS TO UPLOAD FILES. THEY MUST HAVE BEEN DECLARED BEFORE


#---------- SAVING MANAGEMENT METHODS

def loadExamInfos()->dict:
    with open(paths.EXAMINFOS) as json_file:
        examinfos = json.load(json_file)
        return examinfos

def saveExamInfos(examinfos :dict):
    with open(paths.EXAMINFOS, 'w') as outfile:
        examstr = str(json.dumps(examinfos,indent=2))
        outfile.write(examstr)

        
# CORS ERRORS HANDLING 
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