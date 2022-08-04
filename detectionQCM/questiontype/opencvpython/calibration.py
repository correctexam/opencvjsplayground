import numpy as np
from systeme import *
import cv2 as cv
from tools import affiche, creationCarre, decoupe, getPosition,trouveCases
from const import EXAM_COURANT, NB_ELEVES, NB_QUESTIONS,ZONES_COURANTES


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

# à partir des fichiers de réponse déjà découpés, 
# recalibre chacun d'entre eux en se basant sur le template et les cases vides des réponses des élèves. Ne fonctionne que si le décalage entre le template et les cases vides est faible
def reCalibrage(distMaximale = 25):
    chem_ref = "resource/"+EXAM_COURANT+"/references/"
    chem_rep = "resource/"+EXAM_COURANT+"/reponses_eleve_"
    for i in range(1,NB_QUESTIONS+1):
        cases_template,imgs_template = trouveCases(chem_ref+"reponse_q"+str(i)+".png")
        for j in range(1,NB_ELEVES+1):
            chem_rep_eleve = chem_rep+str(j)+"/reponse_q"+str(i)+".png"
            cases_vides_eleve,imgs_vides_eleve = trouveCases(chem_rep_eleve)
            decalages = []
            for case_eleve in cases_vides_eleve:
                dists = [__dist(case_eleve,c) for c in cases_template]
                case_template_associee = cases_template[dists.index(min(dists))]
                x_t,y_t = getPosition(case_template_associee)
                x_e,y_e = getPosition(case_eleve)
                decalage = (x_e-x_t,y_e-y_t)
                if __dist(case_template_associee,case_eleve)<distMaximale : decalages.append(decalage)
            decalage_moy = (__moy(decalages))
            copie = decaleCopie(decalage_moy,chem_rep_eleve)
            cv.imwrite(chem_rep_eleve,copie)

def __dist(case1,case2):
    p1 = np.array(getPosition(case1))
    p2 = np.array(getPosition(case2))
    return np.linalg.norm(p1-p2)
def __moy(coordonnees):
    x_sum = 0
    y_sum = 0
    for x,y in coordonnees:
        x_sum+=x
        y_sum+=y
    n = len(coordonnees)
    return (x_sum/n,y_sum/n)

# Rajoute de la matière (du blanc) ou découpe une copie pour que la décaler en fonction du vecteur indiqué
def decaleCopie(decalage,chem_copie):
    copie = cv.imread(chem_copie)
    h,w,_ = copie.shape
    x,y = decalage
    #decalage horizontal
    if x<0: copie = __decoupePartie(copie,(int(x),int(h)),"DROITE") 
    elif x>0: copie = __decoupePartie(copie,(int(x),int(h)),"GAUCHE") #copie = __ajouteRectangle(copie,(int(x),int(h)),"DROITE")
    # #Mise à jour des dimensions
    # h,w,_ = copie.shape
    # #decalage vertical
    if y<0:  copie = __decoupePartie(copie,(int(x+w),int(y)),"BAS")  # __ajouteRectangle(copie,(int(w+x),int(y)),"HAUT")
    elif y>0:copie = __decoupePartie(copie,(int(x+w),int(y)),"HAUT")
    return copie


def __decoupePartie(img,dims,position="GAUCHE"):
    wcrop,hcrop = dims
    him,wim,_ = img.shape
    if position=="GAUCHE" :img = img[0:him, wcrop:wim].copy()
    elif position=="DROITE":img = img[0:him, 0:wim-wcrop].copy()
    elif position=="HAUT":img = img[hcrop:him, 0:wim].copy()
    elif position=="BAS":img = img[0:him-hcrop, 0:wim].copy()
    return img

