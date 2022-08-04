const ACTION_APPLI = "QCM"//"INE"


function onRuntimeInitialized() {
  cv.then((e) => {
    cv = e;
    const m = new Model(true);
    m.isWarmedUp.then((e) => {
      console.log("CHARGEMENT "+ACTION_APPLI)
      initDetectionCourante(m)
    });
  });
}

function loadTagsNecessaires(){
  if(ACTION_APPLI=="INE")loadTagsINE()
  else if (ACTION_APPLI=="QCM")loadTagsQCM()
}

function initDetectionCourante(m){
  if(ACTION_APPLI=="INE"){
    initDetectionINE(m)
  }
  else if(ACTION_APPLI=="QCM"){
    initDetectionQCM(m)
  }
}

function loadTags(sources,nbOutputs=7,nbCanvasOutputs=7,prefixeIdInput="canvasInput",prefixeIdOutput="result",prefixeIdCanvasOutput="canvas_output"){
  let conteneur = document.getElementById('inputs-container')
  for (const i in sources){
    const img = document.createElement("img")
    img.id = prefixeIdInput+i.toString();
    img.src =  sources[i]
    conteneur.appendChild(img)
  }
  conteneur = document.getElementById('results-container')
  for(let i=0;i<nbOutputs;i++){
    const p = document.createElement("p")
    p.id = prefixeIdOutput+i.toString();
    conteneur.appendChild(p)
  }
  for(let i=0;i<nbCanvasOutputs;i++){
    const can = document.createElement("canvas")
    can.id = prefixeIdCanvasOutput+i.toString();
    conteneur.appendChild(can)
  }
}
/**************************QCM */
{
  function loadTagsQCM(){
    loadTags([
      'detectionQCM/images/question1/reponse.png',
      'detectionQCM/images/question2/reponse.png',
      'detectionQCM/images/question3/reponse.png',
      'detectionQCM/images/question4/reponse.png',
      'detectionQCM/images/question5/reponse.png',
      'detectionQCM/images/question6/reponse.png'

    ])
  }

  function initDetectionQCM(m){
    console.log("Initialisation QCM")
  }
}
/**************************INE */
{
  
  function loadTagsINE(){
  loadTags(["detectionINE/test1.png","detectionINE/test2.png","detectionINE/test3.png","detectionINE/test4.png","detectionINE/test5.png","detectionINE/test6.png","detectionINE/test7.png"])
  }
  function initDetectionINE(m){
    /*      cv.imshow("canvas_output", res.dst);
    cv.imshow("canvas_output1", res.letter[0][1]);
    cv.imshow("canvas_output2", res.pre_result);
    cv.imshow("canvas_output3", res.result);
    cv.imshow("canvas_output4", res.final);*/
    //cv.imshow(, res.invert_final);
    let candidate = [];
    candidate.push("abcde");
    candidate.push("virginie");
    candidate.push("jacques");
    candidate.push("damour");
    candidate.push("deniel");
    candidate.push("amandine");
    candidate.push("eugene");
    candidate.push("barais");
    candidate.push("olivier");
    candidate.push("26011980");

      for (let i = 0; i< 7; i++){
          const  idinput  ="canvasInput"+i
          // console.log(idinput)
    const res1 = fprediction(candidate,m, false, idinput, "canvas_output"+i); 
    const res2 = fprediction(candidate , m , true,idinput);//, "canvas_output1");      
    var paragraph = document.getElementById("result" +i);
      if (res1[1] > res2[1]){
          var text = document.createTextNode(res1[0] + ' ' + res1[1]);
          paragraph.appendChild(text);
    
      }else {
          text = document.createTextNode(res2[0] + ' ' + res2[1]);
          paragraph.appendChild(text);      
      }
    
  }
  }

  function fprediction(cand, m,  lookingForMissingLetter, inputid,canevasId4Debug){
  const res = extractImage(inputid, false, lookingForMissingLetter);
  if (canevasId4Debug){
      cv.imshow(canevasId4Debug, res.invert_final);
  }
  res.dilate.delete();
  res.dst.delete();
  res.pre_result.delete();
  res.result.delete();
  res.final.delete();
  res.invert_final.delete();


  let candidate = [];
  cand.forEach(e => {
      candidate.push([e.padEnd(13," "), 0.0]);
  })
  const predict = [];
  for (let i = 0; i < res.letter.length; i++) {
    let res1 = m.predict(imageDataFromMat(res.letter[i][1]));
    predict.push(res1);
  }
  for (let k = 0; k < candidate.length; k++) {
    for (let j = 0; j < 13; j++) {
      if (j < predict.length) {
        let letter = candidate[k][0].substring(j, j + 1).toLowerCase();

        if (letter === predict[j][0].toLowerCase()) {
          candidate[k][1] = candidate[k][1] + predict[j][1];
        } else {
          candidate[k][1] = candidate[k][1] + (1 - predict[j][1]) / 35;
        }
      }
    }
    candidate[k][1] = candidate[k][1] / predict.length;
  }
  candidate.sort((a, b) => {
    if (a[1] < b[1]) return 1;
    else return -1;
  });
  return candidate[0];

  }


  function extractImage(inputid, removeHorizonzalAndVertical, lookingForMissingLetter) {
  const linelength = 15;
  const repairsize = 1;
  const dilatesize = 1;
  const morphsize = 1;
  const drawcontoursizeh = 4;
  const drawcontoursizev = 4;

  let src = cv.imread(inputid);
  let dst = src.clone();
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_BGR2GRAY, 0);
  let thresh = new cv.Mat();
  cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
  let anchor = new cv.Point(-1, -1);
  if (removeHorizonzalAndVertical) {
  // Step 1 remove vertical lines
  let remove_vertical = new cv.Mat();
  let ksize2 = new cv.Size(1, linelength);
  // You can try more ifferent parameters
  let vertical_kernel = cv.getStructuringElement(cv.MORPH_RECT, ksize2);
  cv.morphologyEx(
    thresh,
    remove_vertical,
    cv.MORPH_OPEN,
    vertical_kernel,
    anchor,
    2,
    cv.BORDER_CONSTANT,
    cv.morphologyDefaultBorderValue()
  );
  let contours2 = new cv.MatVector();
  let hierarchy2 = new cv.Mat();
  cv.findContours(
    remove_vertical,
    contours2,
    hierarchy2,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );
  let fillColor = new cv.Scalar(255, 255, 255);
  cv.drawContours(dst, contours2, -1, fillColor, drawcontoursizev);

  // Step 1 remove horizontal lines

  let remove_horizontal = new cv.Mat();
  let ksize3 = new cv.Size(linelength, 1);
  // You can try more different parameters
  let horizontal_kernel = cv.getStructuringElement(cv.MORPH_RECT, ksize3);
  let anchor1 = new cv.Point(-1, -1);
  cv.morphologyEx(
    thresh,
    remove_horizontal,
    cv.MORPH_OPEN,
    horizontal_kernel,
    anchor1,
    2,
    cv.BORDER_CONSTANT,
    cv.morphologyDefaultBorderValue()
  );
  let contours3 = new cv.MatVector();
  let hierarchy3 = new cv.Mat();
  cv.findContours(
    remove_horizontal,
    contours3,
    hierarchy3,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );
  let fillColor1 = new cv.Scalar(255, 255, 255);
  cv.drawContours(dst, contours3, -1, fillColor1, drawcontoursizeh);
  }

  // Step 3 Repair kernel
  let ksize4 = new cv.Size(repairsize, repairsize);
  let repair_kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, ksize4);
  let mask = new cv.Mat();
  let dtype = -1;
  // 1. Create a Mat which is full of zeros
  let img = cv.Mat.ones(src.rows, src.cols, cv.CV_8UC3);
  img.setTo(new cv.Scalar(255, 255, 255));
  cv.cvtColor(img, img, cv.COLOR_BGR2GRAY, 0);
  // 2. Create a Mat which is full of ones
  // let mat = cv.Mat.ones(rows, cols, type);
  let gray1 = new cv.Mat();
  cv.cvtColor(dst, gray1, cv.COLOR_BGR2GRAY, 0);
  // let img = cv.zeros(src.rows, src.cols, cv.CV_8UC3);
  let dst1 = new cv.Mat();
  cv.subtract(img, gray1, dst1, mask, dtype);
  //cv.subtract(img, dst, dst1);
  let dilate = new cv.Mat();
  cv.dilate(
  dst1,
  dilate,
  repair_kernel,
  anchor,
  dilatesize,
  cv.BORDER_CONSTANT,
  cv.morphologyDefaultBorderValue()
  );

  let pre_result = new cv.Mat();
  let result = new cv.Mat();

  cv.bitwise_and(dilate, thresh, pre_result);
  cv.morphologyEx(
  pre_result,
  result,
  cv.MORPH_CLOSE,
  repair_kernel,
  anchor,
  morphsize,
  cv.BORDER_CONSTANT,
  cv.morphologyDefaultBorderValue()
  );
  let final = new cv.Mat();

  cv.bitwise_and(result, thresh, final);
  let invert_final = new cv.Mat();

  cv.subtract(img, final, invert_final, mask, dtype);

  //        cv.threshold(src, src, 177, 200, cv.THRESH_BINARY);
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(
  final,
  contours,
  hierarchy,
  cv.RETR_EXTERNAL,
  cv.CHAIN_APPROX_TC89_L1
  );
  const letters = new Map();
  for (let ct = 0; ct < contours.size(); ct++) {
  let cnt = contours.get(ct);
  // You can try more different parameters
  let rect = cv.boundingRect(cnt);
  //console.log(rect);

  let rectangleColor = new cv.Scalar(0, 0, 0);
  let point1 = new cv.Point(rect.x, rect.y);
  let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
  //    console.log(rect.width * rect.height);

  if (rect.width * rect.height > 250 ){//&& rect.width < rect.height) {
    let dst1 = new cv.Mat();
    let dst2 = new cv.Mat();
    let dst3 = new cv.Mat();
    dst1 = invert_final.roi(rect); // You can try more different parameters
    let dsize = new cv.Size(26, 26);
    cv.resize(dst1, dst2, dsize, 0, 0, cv.INTER_AREA);
    // let dsizeb = new cv.Size(28, 28);
    // cv.resize(img, dst3, dsizeb, 0, 0, cv.INTER_AREA);
    let s = new cv.Scalar(255, 0, 0, 255);
    cv.copyMakeBorder(dst2, dst3, 1, 1, 1, 1, cv.BORDER_CONSTANT, s);

    // cv.bitwise_and(dst3, dst2, dst4);

    // You can try more different parameters
    letters.set(rect, dst3);
    dst1.delete();
    dst2.delete();
    cv.rectangle(
      invert_final,
      point1,
      point2,
      rectangleColor,
      2,
      cv.LINE_AA,
      0
    );
  }
  }

  src.delete();
  gray.delete();
  thresh.delete();
  if (removeHorizonzalAndVertical) {
  remove_vertical.delete();
  contours2.delete();
  hierarchy2.delete();
  vertical_kernel.delete();
  remove_horizontal.delete();
  contours3.delete();
  hierarchy3.delete();
  horizontal_kernel.delete();
  }

  repair_kernel.delete();
  mask.delete();
  img.delete();
  gray1.delete();
  dst1.delete();
  /*  dilate.delete();
  dst.delete();
  pre_result.delete();
  result.delete();

  final.delete();
  invert_final.delete();*/
  contours.delete();
  hierarchy.delete();
  let lettersf = [...letters];
  lettersf.sort((a, b) => {
  if (a[0].x < b[0].x) return -1;
  else return 1;
  });

  if (lookingForMissingLetter && lettersf.length > 3) {
  const dstavg =
    (lettersf[lettersf.length - 1][0].x - lettersf[0][0].x) / lettersf.length;
  let minDiffX = dstavg;
  let maxHauteur = 0;
  let maxLargeur = 0;
  let minY = 800;
  const nbrMissing = [];
  for (let i = 0; i < lettersf.length - 1; i++) {
    let diffXt = lettersf[i + 1][0].x - lettersf[i][0].x;
    if (diffXt < minDiffX) minDiffX = diffXt;
    if (diffXt > dstavg * 1.7) {
      nbrMissing.push(i);
    }
  if (lettersf[i][0].y < minY) {
        minY = lettersf[i][0].y;
    }
    if (lettersf[i][0].height > maxHauteur)
      maxHauteur = lettersf[i][0].height;
    if (lettersf[i][0].width > maxLargeur) maxLargeur = lettersf[i][0].width;
  }

  const dstavg1 =
    (lettersf[lettersf.length - 1][0].x - lettersf[0][0].x) /
    (lettersf.length + nbrMissing.length);
    nbrMissing.forEach(n => {
    let x = lettersf[n][0].x + dstavg1;

    let rectangleColor = new cv.Scalar(0, 0, 0);
    let point1 = new cv.Point(x, minY);
    let point2 = new cv.Point(x + maxLargeur, minY + maxHauteur);

    let rect = new cv.Rect(x, minY, maxLargeur, maxHauteur);
    let dst1 = new cv.Mat();
    let dst2 = new cv.Mat();
    let dst3 = new cv.Mat();

    dst1 = invert_final.roi(rect); 

    let dsize = new cv.Size(26, 26);
    cv.resize(dst1, dst2, dsize, 0, 0, cv.INTER_AREA);
    let s = new cv.Scalar(255, 0, 0, 255);
    cv.copyMakeBorder(dst2, dst3, 1, 1, 1, 1, cv.BORDER_CONSTANT, s);
    letters.set(rect, dst3);
    dst1.delete();
    dst2.delete();
    cv.rectangle(
      invert_final,
      point1,
      point2,
      rectangleColor,
      2,
      cv.LINE_AA,
      0
    );
  });
  lettersf = [...letters];
  lettersf.sort((a, b) => {
    if (a[0].x < b[0].x) return -1;
    else return 1;
  });
  }
  return {
  letter: lettersf,
  dst: dst,
  dilate: dilate,
  pre_result: pre_result,
  result: result,
  final: final,
  invert_final: invert_final,
  };
  }

  function imageDataFromMat(mat) {
  const img = new cv.Mat();
  const depth = mat.type() % 8;
  const scale =
  depth <= cv.CV_8S ? 1.0 : depth <= cv.CV_32S ? 1.0 / 256.0 : 255.0;
  const shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128.0 : 0.0;
  mat.convertTo(img, cv.CV_8U, scale, shift);
  switch (img.type()) {
  case cv.CV_8UC1:
    cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
    break;
  case cv.CV_8UC3:
    cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
    break;
  case cv.CV_8UC4:
    break;
  default:
    throw new Error(
      "Bad number of channels (Source image must have 1, 3 or 4 channels)"
    );
  }
  const clampedArray = new ImageData(
  new Uint8ClampedArray(img.data),
  img.cols,
  img.rows
  );
  img.delete();
  return clampedArray;
  }
}