import os
import aiofiles
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from grip import export
from pydantic import BaseModel

# run : uvicorn correctapi:questionapp --reload

questionapp = FastAPI()
PREFIXE = 'upload/'

# Fonctions de test pour vérifier que le contact avec l'API se fait bien
@questionapp.get("/question-assistant/greetings")
async def greet():
    return{"message":"Hello and welcome on the MCQ assistant GET service"}

@questionapp.post("/question-assistant/greetings")
async def greet():
    return{"message":"Hello and welcome on the MCQ assistant POST service "}

#Fonctions génériques de dépot de fichier 
@questionapp.post("/question-assistant/uploadimage/")
async def depose_image(clientfile: UploadFile):
    res = await enregistreFichier(clientfile,["image/png","image/jpg"])
    return res

@questionapp.post("/question-assistant/uploadpdf/")
async def depose_pdf(clientfile: UploadFile):
    res = await enregistreFichier(clientfile,['application/pdf'])
    return res

## Partie temporaire, normalement, il faudrait envoyer les zones du template directement croppées et en png. 
## Pour l'instant on envoie le template (pdf) et les indications des zones qu'il faut découper
class QuestionTemplate(BaseModel):
    examId: int
    examName: str
    gradeType: str
    id: int
    numero: int
    point: int
    step: int
    typeAlgoName: str
    typeId: int
    zoneId: int

# TODO: Faire qqch avec ces questions => Les envoyer à opencvpython pour qu'il les découpe ?  (Modifier la constante Zone)
questionsTemplate = []

@questionapp.post("/question-assistant/questiontemplate")
async def renseigne_template(quest:QuestionTemplate):
    # Actualise la liste des questions du template en mettant à jour la question si elle existe déjà
    indextab = [i for i in range(0,len(questionsTemplate)) if questionsTemplate[i].id==quest.id]
    if len(indextab)>0:
        index = indextab[0]
        del questionsTemplate[index]
    questionsTemplate.append(quest) 
    return {'question_loadded':quest in questionsTemplate ,'template_loadded':os.path.exists(PREFIXE+'template-'+str(quest.examId)+'.pdf')}



async def enregistreFichier(fichierclient : UploadFile, formats_acceptes :list[str]):
    if fichierclient.content_type in formats_acceptes:
        chemin_fichier = PREFIXE+fichierclient.filename
        async with aiofiles.open(chemin_fichier, 'wb') as fichierlocal:
            content = await fichierclient.read() 
            await fichierlocal.write(content)  
        return {"save": "success"}
    else : return{"save":"fail","expected":formats_acceptes}


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