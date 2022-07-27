from systeme import effaceAnalyse, effaceFichiers, structureAnalyse
from tools import *
from calibration import NB_ELEVES, calibrer,detectionZones, reinitialisationCalibration

def reinitStructureAnalyse():
    # Phase de création des dossiers nécessaires à l'analyse
    effaceAnalyse(EXAM_COURANT,NB_ELEVES) # Supprime tous les dossiers qui vont être créés (pour éviter les conflits)
    structureAnalyse(EXAM_COURANT,NB_ELEVES) # Crée tous les dossiers nécessaires à l'analyse
    # ## Phase de suppression des fichiers générés automatiquement
    reinitialisationCalibration(EXAM_COURANT)

# Structure le projet et permet d'indiquer les zones relatives aux questions
def premiereFois():
    reinitStructureAnalyse()
    # # Lors de l'ajout d'un nouvel examen, il faut indiquer les zones de calibration :
    detectionZones(EXAM_COURANT)


def main():
    ## Les fonctions sont à commenter / décommenter suivant ce que l'avancement dans l'analyse
    premiereFois()
    # # Phase de calibration : les zones par question sont découpées dans le template et les copies d'élèves 
    #calibrer(EXAM_COURANT)
    # # Phase d'analyse
    #interpretationQCM(NB_QUESTIONS,NB_ELEVES)
    # # Suppression de tous les nouveaux dossiers et fichiers
    #reinitStructureAnalyse()

# Interprète les cases du QCM courant comme étant cochées ou vides
def interpretationQCM(nbReponses,nbEleves):
    effaceFichiers('Temp') #Suppression des fichiers d'analyse déjà produits
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
                diff =  diffCouleurAvecCaseBlanche(img_case_eleve,imgs_template[k]) 
                if(diff>DIFFERENCES_AVEC_CASE_BLANCHE):cases_remplies.append(case)
                else :cases_vides.append(case)
            img_rep_eleve = drawRectangle(img_rep_eleve,cases_remplies,(0,255,0))
            img_rep_eleve = drawRectangle(img_rep_eleve,cases_vides,(0,0,255))
            cv.imwrite("Temp/detection_eleve_"+str(j)+"_q_"+str(i)+".png",img_rep_eleve)
            


if __name__ == '__main__':
    main()