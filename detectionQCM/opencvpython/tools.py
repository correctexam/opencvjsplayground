import functools
import cv2 as cv
import numpy as np
from const import *
from interval import interval

def __afficheImages(images,prefixe="Image "):
    for i,image in enumerate(images):
        cv.imshow(prefixe+str(i),image)
    code = -1 *len(images) #Permet d'éviter le cas où il n'y a pas d'images
    while code <0:
        code = cv.waitKey(1)
        properties = []
        for i in range(0,len(images)):
            prop = cv.getWindowProperty(prefixe+str(i), cv.WND_PROP_VISIBLE)
            properties.append(prop)
        if 0 in properties:
           code = 0
    cv.destroyAllWindows()

#Affiche une ou plusieurs images
#Si on manipule une forme, alors on la convertit. img indiquée devient l'img de référence
def affiche(img,prefixe="Image ",forme="AUCUNE"):
    if type(forme)!=str:
        w,h = getDimensions(forme)
        x,y = getPosition(forme)
        img_crop= decoupe(img,(x,y),(w,h))
        img = img_crop
    if(isinstance(img,list)):
        __afficheImages(img,prefixe)
    else :
        __afficheImages([img],prefixe)

def getDimensions(forme):
    _,_,w,h = cv.boundingRect(forme)
    return w,h
def getAllDimensions(formes):
    dims = []
    for forme in formes:
        dim = getDimensions(forme)
        dims.append(dim)
    return dims

def getAllShapes(imgs):
    ws,hs = [],[]
    for img in imgs:
        h,w = img.shape
        ws.append(w)
        hs.append(h)
    return ws,hs

def getAire(forme):
    w,h = getDimensions(forme)
    return w*h

def getPosition(forme):
    return forme.ravel()[0], forme.ravel()[1]

def decoupe(img,pos,dims):
    x,y = pos
    w,h = dims
    return img[y:y+h, x:x+w]

def uniformise(images,minw = None,minh = None):
    ws,hs =getAllShapes(images)
    if minw == None:
        minw = min(ws)
    if minh == None :
        minh = min(hs)
    img_unif = []
    for image in images :
        h,w = image.shape
        # décallages pour centrer le crop
        dh = int((h - minh)/2)
        dw = int((w - minw)/2)
        #crop
        image = image[dh:minh+dh, dw:minw+dw]
        img_unif.append(image)
    return img_unif

def interpretationForme(contour):
    eps = EPSILON*cv.arcLength(contour,True)
    forme = cv.approxPolyDP(contour,eps,True)
    nom = None
    w,h = getDimensions(forme)
    if w>=MIN_WIDTH_SHAPE and h>=MIN_HEIGHT_SHAPE:
        nbCotes = len(forme)
        match nbCotes:
            case 1:
                nom = "LIGNE"
            case 3:
                nom = "TRIANGLE"
            case 4:
                ratio = float(w)/h
                if ratio>= 0.95 and ratio <= 1.05:
                    nom = "CARRE"
                else :
                    nom = "RECTANGLE"
            case _: nom = None
    return nom,forme


def detectFormes(img,nomsFormes = []):
    _,thrash = cv.threshold(img,240,255,cv.THRESH_BINARY)
    contours, hierarchy = cv.findContours(thrash,cv.RETR_TREE,cv.CHAIN_APPROX_NONE)
    formes = []
    for contour in contours:
        nom,forme = interpretationForme(contour)
        if nom in nomsFormes:
           # affiche(img,forme=forme)
            formes.append(forme)
    #Tri des formes pour que l'ordre des cases détecté soit intuitif
    formes.sort(key=functools.cmp_to_key(__comparePosition))
    #Filtrage des 'doublons' : opencv a souvent tendance à repérer 2 carrés (très proches) au lieu d'un 
    formes = [x for i,x in enumerate(formes) if not faitDoublon(i,formes)] 
    return formes

#Comparaison personnalisée de positions (lecture haut-bas,gauche-droite)
def __comparePosition(f1,f2):
    x1,y1 = getPosition(f1)
    x2,y2 = getPosition(f2)
    if y1<y2:return -1
    elif y1>y2: return 1
    else : return x1-x2

# Indique si une forme contient (entièrement ou partiellement) une autre
def intersection(f1,f2):
    return __f2Inf1(f1,f2) or __f2Inf1(f2,f1)

def __f2Inf1(f1,f2):
    x1,y1 = getPosition(f1)
    x2,y2 = getPosition(f2)
    w1,h1 = getDimensions(f1)
    w2,h2 = getDimensions(f2)
    inter_x =   x2 in interval([x1 , x1+w1]) or x2+w2 in interval([x1 , x1+w1]) 
    inter_y =   y2 in interval([y1, y1+h1]) or y2+h2 in interval([y1, y1+h1])
    return inter_x and inter_y


# Indique si une forme est en intersection avec une autre et est moins intéressante 
def faitDoublon(indice,formes)->bool:
    f = formes[indice]
    for i,f_ in enumerate(formes):
      if  indice<i and intersection(f,f_):
            return True
    return False

# Trouve les cases qui composent l'image désignée par le chemin
def trouveCases(chemin_copie):
    img_src = cv.imread(chemin_copie)
    #Coloration de l'image en gris
    img = cv.cvtColor(img_src,cv.COLOR_BGR2GRAY)
    formes_cases = detectFormes(img,["CARRE","RECTANGLE"])
    cases = []
    img_cases = []
    # Enregistrement des cases de l'image (tous les carrés détectés)
    for forme in formes_cases:
        w,h = getDimensions(forme)
        x,y = getPosition(forme)
        cases.append(forme)
        img_cases.append(decoupe(img,(x,y),(w,h)))
    return cases,img_cases

def drawRectangle(img,formes,couleur=(255,0,0),epaisseur=2):
    # Attention on est ici en bgr et non en rgb
    for forme in formes:
        x,y = getPosition(forme)
        w,h = getDimensions(forme)
        pointMin = (x,y)
        pointMax = (x+w,y+h)
        cv.rectangle(img,pointMin,pointMax,couleur,epaisseur)
    return img

def couleurMoyenneImage(img):
    average_color_row = np.average(img, axis=0)
    avg = np.average(average_color_row, axis=0)
    # Si l'image est en nuances de gris, il est possible qu'avg soit une valeur simple et non un tuple (r,g,b)
    if avg.size == 1:
        avg = (avg,avg,avg)
    return avg

#Même fonctionnement que pour la moyenne
def couleurMedianeImage(img):
    med_color_row = np.median(img, axis=0)
    med = np.average(med_color_row, axis=0)
    if med.size == 1:med = (med,med,med)
    return med

def creationCarre(w,h,couleur=(0,0,0),alpha=0.4):
    coul_img = np.ones((w,h,3), dtype=np.uint8)
    cv.rectangle(coul_img, (0, 0), (h, w), (255,255,255), -1)
    transp = cv.rectangle(coul_img.copy(), (0, 0), (h, w), couleur, -1)
    coul_img = cv.addWeighted(transp,alpha,coul_img,1-alpha,0)
    return coul_img

# Renvoie un pourcentage de différences entre une image de case et une considérée comme vide
def diffCouleurAvecCaseBlanche(img_case,img_vide):
    return abs(couleurMoyenneImage(img_case)[0] - couleurMoyenneImage(img_vide)[0])/255

