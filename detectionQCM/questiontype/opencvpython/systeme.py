import os
from pdf2image import convert_from_path



def pdf2png(pdf_input_path, png_output_path):
    pages = convert_from_path(pdf_input_path, 500)
    for page in pages:
        page.save(png_output_path, 'PNG')

def effaceFichier(chem_fichier :str):
    if os.path.exists(chem_fichier):
        os.remove(chem_fichier)

def effaceFichiers(dir : str):
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))

def creeDossier(dir : str):
    if not os.path.isdir(dir):
        os.mkdir(dir)

def supprimeDossier(dir:str):
     if os.path.isdir(dir):
        effaceFichiers(dir)
        os.rmdir(dir)

# Crée les différents dossiers nécessaires à l'analyse du QCM
def structureAnalyse(nomexam,nbEleves):
    chemin = 'Temp'
    creeDossier(chemin)
    chemin = 'resource/'+nomexam+'/copies/conversion_png'
    creeDossier(chemin)
    chemin = 'resource/'+nomexam+'/references'
    creeDossier(chemin)
    for i in range(1,nbEleves+1):
        chemin = 'resource/'+nomexam+'/reponses_eleve_'+str(i)
        creeDossier(chemin)

def effaceAnalyse(nomexam,nbEleves):
    chemin = 'Temp'
    supprimeDossier(chemin)
    chemin = 'resource/'+nomexam+'/copies/conversion_png'
    supprimeDossier(chemin)
    chemin = 'resource/'+nomexam+'/references'
    supprimeDossier(chemin)
    for i in range(1,nbEleves+1):
        chemin = 'resource/'+nomexam+'/reponses_eleve_'+str(i)
        supprimeDossier(chemin)

def ecrireFichier(chemin_fichier :str,contenu : str):
    with open(chemin_fichier,'w') as f:
        f.write(contenu)