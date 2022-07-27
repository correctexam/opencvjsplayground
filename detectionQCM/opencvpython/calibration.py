from systeme import *
import cv2 as cv
from tools import affiche, decoupe, getPosition,trouveCases 
from const import NB_ELEVES,ZONES_COURANTES


# Efface les fichiers produits pour la calibration
def reinitialisationCalibration(nomexam):
    effaceFichiers('resource/'+nomexam+'/copies/conversion_png')
    effaceFichiers('resource/'+nomexam+"/references")
    for i in range(1,NB_ELEVES+1):
        effaceFichiers('resource/'+nomexam+"/reponses_eleve_"+str(i))
 

def calibrer(nomexam):
    zoneInteressanteTemplate(nomexam,ZONES_COURANTES)
    for i in range(1,NB_ELEVES+1):
           zoneInteressanteEleve(i,nomexam,ZONES_COURANTES)

# Stocke chaque zone de la copie comme étant une réponse
def zoneInteressante(chem_copie,dossier_res,zones):
    img = cv.imread(chem_copie+".png")
    for i,zone in enumerate(zones):
        (xmin,ymin),(largeur,longueur) = zone
        img_q = decoupe(img,(xmin,ymin),(largeur,longueur))
        cv.imwrite(dossier_res+"/reponse_q"+str(i+1)+".png",img_q)

# Stocke chaque zone de la copie de l'élève comme une réponse
# La copie est convertie en image seulement si cela n'a pas déjà été fait
def zoneInteressanteEleve(ideleve,nomexam,zones):
    chem_copie_pdf = "resource/"+nomexam+"/copies/copie_"+str(ideleve)
    chem_copie_png = "resource/"+nomexam+"/copies/conversion_png/copie_"+str(ideleve)
    dossier_res = "resource/"+nomexam+"/reponses_eleve_"+str(ideleve)
    #la conversion est coûteuse en ressources, on évite donc de la refaire sans arrêts
    if not os.path.exists(chem_copie_png+".png") :pdf2png(chem_copie_pdf+".pdf",chem_copie_png+".png")
    zoneInteressante(chem_copie_png,dossier_res,zones)

# Stocke chaque zone du template comme étant une réponse de référence 
def zoneInteressanteTemplate(nomexam,zones):
    dossier_res = "resource/"+nomexam+"/references"
    chem_copie_png=__conversionTemplate(nomexam)
    zoneInteressante(chem_copie_png,dossier_res,zones)
    
# Convertit le template de l'exam en png seulement si c'est nécéssaire.
# Renvoie le chemin de stockage du template quoi qu'il arrive
def __conversionTemplate(nomexam):
    chem_copie_pdf = "resource/"+nomexam+"/copies/"+nomexam
    chem_copie_png = "resource/"+nomexam+"/copies/conversion_png/"+nomexam
    convertir = not os.path.exists(chem_copie_png+".png")
    if convertir :
        pdf2png(chem_copie_pdf+".pdf",chem_copie_png+".png")
    return chem_copie_png


def detectionZones(nomexam):
    chem_img =__conversionTemplate(nomexam)
    chem_img = chem_img+".png"
    cases,imgs = trouveCases(chem_img)
    img = cv.imread(chem_img)
    for case in cases:
        pos = getPosition(case)
        img = cv.putText(img,str(pos),pos,cv.FONT_HERSHEY_COMPLEX,2,(0,0,255),3)
    cv.imwrite('Temp/info_zones.png',img)