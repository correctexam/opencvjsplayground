import os

from numpy import append
from tools import *
from pdf2image import convert_from_path

import ghostscript

def pdf2jpeg(pdf_input_path, jpeg_output_path):
    args = ["pdf2jpeg", # actual value doesn't matter
            "-dNOPAUSE",
            "-sDEVICE=jpeg",
            "-r144",
            "-sOutputFile=" + jpeg_output_path,
            pdf_input_path]
    ghostscript.Ghostscript(*args)

def pdf2png(pdf_input_path, png_output_path):
    pages = convert_from_path(pdf_input_path, 500)
    for page in pages:
        page.save(png_output_path, 'PNG')


# Noms d'exam :
# premierexam
# examadn
EXAM_COURANT="examadn" #"premierexam"
ZONES_COURANTES= [((350,2200),(800,650)),((350,2850),(800,800))]
DETECTIONS = []

def effaceFichiers(dir : str):
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))

def zoneInteressante(chem_copie,dossier_res,zones):
    #Conversion
    pdf2png(chem_copie,chem_copie+".png")
    img = cv.imread(chem_copie+".png")
    #detectionZones(chem_copie+".png")
    for i,zone in enumerate(zones):
        (xmin,ymin),(largeur,longueur) = zone
        img_q = decoupe(img,(xmin,ymin),(largeur,longueur))
        cv.imwrite(dossier_res+"/reponse_q"+str(i+1)+".png",img_q)
    os.remove(chem_copie+".png")

# Pour plus tard 
def detectionZones(chem_img):
    cases,imgs = trouveCases(chem_img)
    img_src = cv.imread(chem_img)
    # Gestion du carre blanc
    carre_blanc,img_carre_blanc = trouveCases(getCarreBlanc())
    img_carre_blanc = img_carre_blanc[0]
    carre_blanc = carre_blanc [0]
    aire = img_carre_blanc.shape[0] * img_carre_blanc.shape[1]
    carres_acceptes = []
    # Stockage des carrés de taille acceptable
    for i,img_case in enumerate(imgs):
        if img_case.shape[0]*img_case.shape[1]<(aire*10):
            print(img_case.shape[0]*img_case.shape[1])
            carres_acceptes.append(cases[i])
    # Séparation des zones (à faire)
    zones = []
    # img = drawRectangle(img_src,carres_acceptes)
    # cv.imwrite("Temp/zones.png",img)



def zoneInteressanteEleve(ideleve,nomexam,zones):
    chem_copie = "resource/copies/copie_"+str(ideleve)+".pdf"
    dossier_res = "resource/"+nomexam+"/reponses_eleve_"+str(ideleve)
    zoneInteressante(chem_copie,dossier_res,zones)

def zoneInteressanteTemplate(nomexam,zones):
    chem_copie = "resource/copies/"+nomexam+".pdf"
    dossier_res = "resource/"+nomexam+"/references"
    zoneInteressante(chem_copie,dossier_res,zones)

def main():
    # Découpe des zones (à n'exécuter que la première fois)
    # zoneInteressanteTemplate(EXAM_COURANT,ZONES_COURANTES)
    # for i in [1,2,3]:
    #        zoneInteressanteEleve(i,"examadn",ZONES_COURANTES)
    #effaceFichiers('Temp')
    #parcoursReponses(1,6,1,surligneCasesDetectees)
    #parcoursReponses(1,2,3,surligneCasesDetectees)
    interpretationQCM(2,3)






def interpretationQCM(nbReponses,nbEleves):
    #On récupère le template des réponses pour chaque question
    template_rep = []
    for i in range(1,nbReponses+1):
        chem_reponse = "resource/"+EXAM_COURANT+"/references/reponse_q"+str(i)+".png"
        cases_template,imgs_template = trouveCases(chem_reponse)
        for j in range(1,nbEleves+1):
            chem_reponse = "resource/"+EXAM_COURANT+"/reponses_eleve_"+str(j)+"/reponse_q"+str(i)+".png"
            img_rep_eleve = cv.imread(chem_reponse)
            img_rep_eleve = drawRectangle(img_rep_eleve,cases_template,(255,0,0))
            cases_remplies,cases_vides = [],[]
            for k,case in enumerate(cases_template):
                img_case_eleve = cv.cvtColor(decoupe(img_rep_eleve,getPosition(case),getDimensions(case)),cv.COLOR_BGR2GRAY)
                diff =  diffCouleurAvecCaseBlanche(img_case_eleve,imgs_template[k]) #distanceAvecCaseBlanche(img_case_eleve,imgs_template[k])
                if(diff>DIFFERENCES_AVEC_CASE_BLANCHE):cases_remplies.append(case)
                else :cases_vides.append(case)
            img_rep_eleve = drawRectangle(img_rep_eleve,cases_remplies,(0,255,0))
            img_rep_eleve = drawRectangle(img_rep_eleve,cases_vides,(0,0,255))
            cv.imwrite("Temp/detection_eleve_"+str(j)+"_q_"+str(i)+".png",img_rep_eleve)
            

        











def detecteCasesSurImage(chem_img):
    cases,imgs = trouveCases(chem_img)
    img_src = cv.imread(chem_img)
    img = drawRectangle(img_src,cases)
    cases_remplies,cases_vides = interpretationsCasesAvecCaseBlanche(imgs,cases,getCarreBlanc())
    return img,cases_remplies,cases_vides


def surligneCasesDetectees(reponse):
    img,cases_remplies,cases_vides = detecteCasesSurImage(reponse)
    img = drawRectangle(img,cases_remplies,(0,255,0))
    img = drawRectangle(img,cases_vides,(0,0,255))
    DETECTIONS.append(img)
    cv.imwrite("Temp/detection"+str(len(DETECTIONS))+".png",img)

def afficheCasesDecoupees(reponse):
   cases,_ = trouveCases(reponse)
   cases.append(cv.imread(reponse))
   coul = []
   for case in cases:
        coul.append(creationCarre(10,10,couleurMoyenneImage(case)))
   affiche(coul)
   affiche(cases)

# Parcours les réponses des élèves et leur applique un traitement spécifique (par défaut ne fait rien)
def parcoursReponses(id_deb=1,id_fin=6,nbEleves=1,f=()):
    for n in range(1,nbEleves+1):
        for i in range(id_deb,id_fin+1):
            chemin = "resource/"+EXAM_COURANT+"/reponses_eleve_"+str(n)+"/"
            reponse = chemin +"reponse_q"+str(i)+".png"
            f(reponse)

def getCarreBlanc():
    return  "resource/"+EXAM_COURANT+"/references/carre_blanc.png"

if __name__ == '__main__':
    main()