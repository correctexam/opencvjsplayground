
// Installation/Settup
const MIN_WIDTH_SHAPE = 10
const MIN_HEIGHT_SHAPE = 10
const EPSILON = 0.0145 // 0.03

// Interprétation
const DIFFERENCES_AVEC_CASE_BLANCHE = 0.2


function getDimensions(forme){
    let rect = cv.boundingRect(forme)
//    return w,h
    return {
        w:rect.width, h:rect.height
    }
}


function getAllDimensions(formes){
    const dims = []
    formes.forEach(forme=> {
        dim = getDimensions(forme)
        dims.push(dim)
    })
    return dims
}


function getAllShapes(imgs){
    const ws = [];
    const hs = [];
    imgs.forEach(img=> {
        h,w = img.shape
        ws.push(w)
        hs.push(h)
    })
    return {
        ws:ws,
        hs:hs
    }
}

function __moy(coordonnees){
    if (coordonnees.length > 0){
    let x_sum = 0
    let y_sum = 0
    coordonnees.forEach(e=> {
        x_sum+=e.x
        y_sum+=e.y

    }) 
    return {x:x_sum/coordonnees.length,y:y_sum/coordonnees.length}
    } else return {x:0,y:0}
}

function getAire(forme){
    const l = getDimensions(forme)
    return l.w*l.h
}

function getPosition(forme){
    let rect = cv.boundingRect(forme)
    return {x:rect.x, y:rect.y}
}

function decoupe(img,pos,dims){
    let dst = new cv.Mat();
    // You can try more different parameters
    let rect = new cv.Rect(pos.x, pos.y, dims.w, dims.h);
    dst = img.roi(rect);
    return dst;
}


function interpretationForme(contour){
    let eps = EPSILON*cv.arcLength(contour,true)
    const forme = new cv.Mat();
    cv.approxPolyDP(contour,forme,eps,true)
    let nom = undefined
    let dims = getDimensions(forme)
    
    if (dims.w>=MIN_WIDTH_SHAPE && dims.h>=MIN_HEIGHT_SHAPE){

//        console.log(forme)
//        console.log(forme.data.length)
        nbCotes = forme.rows;// len(forme)
        if (nbCotes === 1) {
            nom = "LIGNE"
        } else if (nbCotes === 3) {
            nom = "TRIANGLE"
        } else if (nbCotes === 4) {
            const ratio = dims.w/dims.h
            if (ratio>= 0.95 && ratio <= 1.05)
                nom = "CARRE"
            else 
                nom = "RECTANGLE"
            
        }
        else {
            nom = undefined
        }
    }
    return {nom:nom,forme:forme}
}

function detectFormes(img,nomsFormes = []){
    let thrash = new cv.Mat();
    cv.threshold(img,thrash,245,255,cv.THRESH_BINARY)
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();  
    cv.findContours(thrash,contours, hierarchy,cv.RETR_TREE,cv.CHAIN_APPROX_NONE)
    const formes = []
    // approximates each contour to polygon
    for (let i = 0; i < contours.size(); ++i) {
    let tmp = new cv.Mat();
    let contour = contours.get(i);
    //contours.forEach(contour=> {
        let res = interpretationForme(contour)
        if (nomsFormes.includes(res.nom )){
            // affiche(img,forme=forme)
            formes.push(res.forme)

        }
    }

    // Tri des formes pour que l'ordre des cases détecté soit intuitif
    formes.sort(__comparePosition)
//    formes.sort(key=functools.cmp_to_key(__comparePosition))
    // Filtrage des 'doublons' : opencv a souvent tendance à repérer 2 carrés (très proches) au lieu d'un 
    const res = [];
    const todelete = [];
    formes.forEach((x,i)=> {
        if (!faitDoublon(i,formes)){
            res.push(x)
        } else {
            todelete.push(x);
        }
    })
    todelete.forEach(x=> {
        x.delete();
    })
    return res
}

// Comparaison personnalisée de positions (lecture haut-bas,gauche-droite)
function __comparePosition(f1,f2){
    let x1,y1 = getPosition(f1)
    let x2,y2 = getPosition(f2)
    if (y1<y2) return -1
    else if (y1>y2) return 1
    else return x1-x2
}

function __comparePositionX(f1,f2){
    let pos1 = getPosition(f1)
    let pos2 = getPosition(f2)
    return pos1.x - pos2.x
}

// Indique si une forme contient (entièrement ou partiellement) une autre
function intersection(f1,f2){
    return __f2Inf1(f1,f2) || __f2Inf1(f2,f1)
}

function __f2Inf1(f1,f2) {
    let pos1 = getPosition(f1)
    let pos2 = getPosition(f2)
    let dim1 = getDimensions(f1)
    let dim2 = getDimensions(f2)
    const inter_x =   (pos2.x >= pos1.x  && pos2.x <= pos1.x+dim1.w) || (pos2.x+dim2.w  >= pos1.x && pos2.x+dim2.w  <=  pos1.x+dim1.w) 
    const inter_y =   (pos2.y  >= pos1.y &&  pos2.y  <= pos1.y+dim1.h) || (pos2.y+dim2.h >= pos1.y && pos2.y+dim2.h <= pos1.y+dim1.h)
    return inter_x && inter_y
}

// Indique si une forme est en intersection avec une autre et est moins intéressante 
function faitDoublon(indice,formes){
    let f = formes[indice]
    let res = false
    formes.forEach((f_,i)=> {
        if  (indice<i && intersection(f,f_))
        res =true || res
    });
    return res
}

// Trouve les cases qui composent l'image désignée par le chemin
function trouveCases(img){
    const formes_cases = detectFormes(img,["CARRE","RECTANGLE"])
    const cases = []
    const img_cases = []
    // Enregistrement des cases de l'image (tous les carrés détectés)
    formes_cases.forEach(forme=> {
        const dim = getDimensions(forme)
        const pos = getPosition(forme)
        cases.push(forme)
        img_cases.push(decoupe(img,pos,dim))
    })
    return {cases: cases,img_cases: img_cases}
}

function trouveCasesOtherImage(img,imgdest){
    const formes_cases = detectFormes(img,["CARRE","RECTANGLE"])
    const cases = []
    const img_cases = []
    // Enregistrement des cases de l'image (tous les carrés détectés)
    formes_cases.forEach(forme=> {
        const dim = getDimensions(forme)
        const pos = getPosition(forme)
        cases.push(forme)
        img_cases.push(decoupe(imgdest,pos,dim))
    })
    return {cases: cases,img_cases: img_cases}
}

function drawRectangle(img,formes,couleur=new cv.Scalar(255, 0, 0, 128),epaisseur=2){
    // Attention on est ici en bgr et non en rgb
    formes.forEach((forme,index)=> {
        const pos= getPosition(forme)
        const dim = getDimensions(forme)
        let pointMin = new cv.Point(pos.x, pos.y);
        let pointMax = new cv.Point(pos.x + dim.w, pos.y + dim.h);
        cv.rectangle(img,pointMin,pointMax,couleur,epaisseur, 0
    )
    })
    return img
}

function analyseStudentSheet(casesExamTemplate,templateimage,studentScanImage){
    const cases_remplies= []
    const cases_vides = []
    let infos_cases = {}
    //imgs_template =[]
    /*casesExamTemplate.cases.forEach((case1,k)=> {
      imgs_template.push(decoupeMoins1(templateimage,getPosition(case1),getDimensions(case1)))    
    })*/
    casesExamTemplate.cases.forEach((case1,k)=> {
      // Pour chaque (x,y) associé à une case du template, on récupère la zone située au même endroit sur la copie
      // et on la compare avec celle du template
      const img_case_eleve = decoupe(studentScanImage,getPosition(case1),getDimensions(case1))
      const diff =  diffCouleurAvecCaseBlanche(img_case_eleve) 

      if(diff>DIFFERENCES_AVEC_CASE_BLANCHE){
        infos_cases[k]={"verdict" :true,"prediction" : diff}
        cases_remplies.push(case1)
      } else {
        infos_cases[k]={"verdict" :false,"prediction" : diff}
        cases_vides.push(case1)
      }
      if (diff> 0.16 && diff < 0.25){
        cv.putText(studentScanImage,  ""+(diff.toFixed(2)),{x:getPosition(case1).x,y:getPosition(case1).y-5},cv.FONT_HERSHEY_COMPLEX,0.5,new cv.Scalar(255,0,0,128),1)

      }else {
        cv.putText(studentScanImage,  ""+(diff.toFixed(2)),{x:getPosition(case1).x,y:getPosition(case1).y-5},cv.FONT_HERSHEY_COMPLEX,0.33,new cv.Scalar(255,0,0,128),1)

      }
      img_case_eleve.delete();
    })

    drawRectangle(studentScanImage,cases_remplies, new cv.Scalar(0,255,0,128))
    drawRectangle(studentScanImage,cases_vides, new cv.Scalar(0,0,255,128))
   /* imgs_template.forEach(img=> {
      //  img.delete();
    })*/
}

function computeDecallage(casesvideseleves, casesvidesexamtemplate){
    const decalages= [];
    casesvideseleves.cases.forEach( (casevideeleve) => {
      let smalldist =500;
      let currentBox = undefined
      casesvidesexamtemplate.cases.forEach( (c) => {
        const dist = __dist(casevideeleve,c) 
        if (smalldist > dist && dist < 25) {
          smalldist =dist
          currentBox = c
        }
      })
      if (currentBox !==undefined) {
       // m.set(casevideeleve, currentBox)
        let poseleve = getPosition(casevideeleve)
        let posref = getPosition(currentBox)
        let decalage = {x: poseleve.x- posref.x,y:poseleve.y- posref.y}
        decalages.push(decalage)
      }
    })
    return (__moy(decalages))
}

function applyTranslation(src1,decalage){
    let dst = new cv.Mat();
    if (decalage.x !== 0 || decalage.y !== 0){
      let M = cv.matFromArray(2, 3, cv.CV_64FC1, [1, 0, - decalage.x, 0, 1, -   decalage.y]);
      let dsize = new cv.Size(src1.cols, src1.rows);
      // You can try more different parameters
      cv.warpAffine(src1, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
      return dst;
    }
    else {
        return src1;
    }
}

function __dist(case1,case2){
    const rect1 = cv.boundingRect(case1)
    const rect2 = cv.boundingRect(case2)
    let x1 = rect1.x + rect1.width/2
    let y1 = rect1.y + rect1.height/2
    
    let x2 = rect2.x + rect2.width/2
    let y2 = rect2.y + rect2.height/2
    
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}




function creationCarre(w,h,couleur=cv.Scalar(0,0,0),alpha=0.4){
    coul_img = np.ones((h,w,3), dtype=np.uint8)
    cv.rectangle(coul_img, (0, 0), (w, h), (255,255,255), -1)
    transp = cv.rectangle(coul_img.copy(), (0, 0), (w, h), couleur, -1)
    coul_img = cv.addWeighted(transp,alpha,coul_img,1-alpha,0)
    return coul_img
}

// Renvoie un pourcentage de différences entre une image de case et une considérée comme vide
function diffCouleurAvecCaseBlanche(img_case){
 let gray = new cv.Mat();
  cv.cvtColor(img_case, gray, cv.COLOR_RGBA2GRAY, 0);
  let thresh = new cv.Mat();
  cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
  let nonzerorationforeleve = cv.countNonZero(thresh) / (img_case.rows * img_case.cols);
    gray.delete();
    return nonzerorationforeleve;
}

let ii=0;
function diffGrayAvecCaseBlanche(img_case){
     let thresh = new cv.Mat();
//     cv.threshold(img_case, thresh, 230, 255, cv.THRESH_BINARY_INV );
    cv.adaptiveThreshold(img_case, thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 3, 2);
    if (ii< 8){
        cv.imshow("canvas_output"+ii,      thresh);
        ii = ii +1;
    }

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    
    let finalrect = undefined;
    
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let rect = cv.boundingRect(cnt);
        if (rect.width > 1 && rect.height > 1){
            if (!(finalrect != undefined && (finalrect.width > rect.width || finalrect.height > rect.height ))){
                finalrect = rect;
            }
        }
    }

    if (finalrect !== undefined){
        console.log(finalrect)
        let dst = new cv.Mat();
        dst = thresh.roi(finalrect);
        let nonzerorationforeleve = cv.countNonZero(dst) / (finalrect.width * finalrect.height);
        console.log(finalrect,nonzerorationforeleve)
        return nonzerorationforeleve; 
    } else return 0;
    


   }