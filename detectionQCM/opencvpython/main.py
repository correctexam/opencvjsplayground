from tools import *

def main():
    parcoursReponses(1,6,surligneCasesDetectees)
    

def surligneCasesDetectees(reponse):
    cases,imgs = trouveCases(reponse)
    img_src = cv.imread(reponse)
    img = drawRectangle(img_src,cases)
    cases_remplies,cases_vides = interpretationCourante(imgs,cases)
    img = drawRectangle(img,cases_remplies,(0,255,0))
    img = drawRectangle(img,cases_vides,(0,0,255))
    affiche(img)

def afficheCasesDecoupees(reponse):
   cases,_ = trouveCases(reponse)
   cases.append(cv.imread(reponse))
   coul = []
   for case in cases:
        coul.append(creationCarre(10,10,couleurMoyenneImage(case)))
   affiche(coul)
   affiche(cases)

# Parcours les réponses des élèves et leur applique un traitement spécifique (par défaut ne fait rien)
def parcoursReponses(id_deb=1,id_fin=6,f=()):
    for i in range(id_deb,id_fin+1):
        chemin = "resource/reponsesquestions/question"+str(i)+"/"
        reponse = chemin +"reponse.png"
        f(reponse)



if __name__ == '__main__':
    main()